const express = require('express');
const router = express.Router();
const cors = require('cors')
const { pool, poolConnect, sql } = require('../db-interface')
const firstDibsScraper = require('../first-dibs-scraper')
const imageUploader = require('../image-uploader')
require('dotenv').config()

const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.GSUITE_CLIENT_ID)

async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
  });

  const userPayload = ticket.getPayload()

  if (userPayload.hd !== 'lawrencefarmsantiques.com') {
    // todo - pretty sure this code is impossible to hit because the oauth client is internal only
    console.log("You are not a part of this organization or incorrect credentials provided")
    return {
      verified: false,
      userPayload: userPayload
    }
  } else {
    return {
      verified: true,
      userPayload: userPayload
    }
  }
}

// enable cors for allowed origins
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : 'http://localhost:8080',
}
router.use(cors(corsOptions))
router.options('*', cors(corsOptions))

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('LFA2 Backend -- Nothing has been requested')
});

router.get('/version', (req, res, next) => {
  console.log(`/version -- ${process.env.GIT_HASH}`)
  res.send({
    gitHash: process.env.GIT_HASH
  })
})

/* Do a GET to query the DB */
router.get('/items', async (req, res, next) => {
  // get page query param
  let page = req.query.page
  let sort = req.query.sort
  let unsold = req.query.unsold

  // dynamically set itemsPerPage
  let itemsPerPage = req.query.itemsPerPage == undefined ? 36 : req.query.itemsPerPage

  if (page === undefined) {
    page = "1"
  }

  if (sort === undefined) {
    sort = "recent"
  }

  if (unsold === undefined) {
    unsold = "false"
  }

  const dbSort = sort === "recent" ? "Image" : "ItemName"
  const query = `
    DECLARE @PageNumber AS INT, @RowspPage AS INT
    SET @PageNumber = @p_page
    SET @RowspPage = @p_itemsPerPage
    SELECT ItemName, Url, CAST(Image AS INT) AS Image, Sold
    FROM dbo.StoreItems
    ${unsold === 'true' ? "WHERE Sold != 'isSold'" : ""}
    ORDER BY ${dbSort} ${dbSort === "ItemName" ? "asc" : "desc"}
    OFFSET ((@PageNumber - 1) * @RowspPage)
    ROWS FETCH NEXT @RowspPage ROWS ONLY;`

  try {
    await poolConnect
    const result = await pool.request()
      .input('p_page', sql.Int, parseInt(page))
      .input('p_itemsPerPage', sql.Int, parseInt(itemsPerPage))
      .query(query)
    res.send(result.recordset)
  } catch (err) {
    console.log('Statement failed: ' + err)
    res.status(500).send(err)
  }
})

router.delete('/item/:image', async (req, res, next) => {
  try {
    const authResult = await verify(req.query.token)
    if (!authResult.verified) {
      return res.status(403).send({ error: 'Unauthorized' })
    }

    await poolConnect
    const result = await pool.request()
      .input('p_image', sql.NVarChar, req.params.image)
      .query('DELETE FROM dbo.StoreItems WHERE Image=@p_image')
    res.send(result.recordset)
  } catch (error) {
    console.log(error)
    res.status(403).send({ error: 'Unauthorized' })
  }
})

// returns COUNT of all items in db, used to calculate number of pages
router.get('/all-items', async (req, res, next) => {
  let unsold = req.query.unsold
  if (unsold === undefined) {
    unsold = "false"
  }

  const query = `select count(*) as ItemCount
  from dbo.StoreItems
  ${unsold === 'true' ? "WHERE Sold != 'isSold'" : ""}`

  try {
    await poolConnect
    const result = await pool.request().query(query)
    res.send(result.recordset[0])
  } catch (err) {
    console.log('Statement failed: ' + err)
    res.status(500).send(err)
  }
})

router.get('/get-hero-image', async (req, res, next) => {
  let url = req.query.url
  // let itemName = req.query.itemName

  if (url === undefined) {
    res.send({ error: "NO_URL_PROVIDED" })
  } else {
    let itemDetails = await firstDibsScraper.getProductHeroImage(url)
    res.send(itemDetails)
  }
})

router.get('/latest-image-reference', async (req, res, next) => {
  try {
    await poolConnect
    const result = await pool.request()
      .query('select top(1) * from dbo.StoreItems ORDER BY CONVERT(int, Image) desc')
    res.send(result.recordset[0])
  } catch (err) {
    console.log('Statement failed: ' + err)
    res.status(500).send(err)
  }
})

router.post('/token-signin', async (req, res, next) => {
  // decrypt token
  try {
    const result = await verify(req.body.token)

    if (result.verified) {
      res.send(result.userPayload)
    } else {
      res.status(403).send(result.userPayload);
    }
  } catch (error) { console.log(error) }
})

router.post('/item', async (req, res, next) => {

  // decrypt token
  try {
    const authResult = await verify(req.body.token)
    if (!authResult.verified) {
      return res.status(403).send({ error: 'Unauthorized' })
    }

    // upload image to cloudinary
    imageUploader.upload(req.body.cdnUrl, `${process.env.IMAGE_FOLDER}/${req.body.imageName}`, async (result) => {
      const newQuery = `
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN TRAN

          IF EXISTS ( SELECT * FROM dbo.StoreItems WITH (UPDLOCK) WHERE ItemName = @p_name )

            UPDATE dbo.StoreItems
              SET Url=@p_firstDibsUrl,
               Image=@p_imageName,
               Sold=@p_sold,
               DateAdded=GETDATE()
            WHERE ItemName = @p_name;

          ELSE
            INSERT dbo.StoreItems (ItemName, Url, Image, Sold, DateAdded)
          VALUES (@p_name, @p_firstDibsUrl, @p_imageName, @p_sold, GETDATE())

        COMMIT
      `

      try {
        await poolConnect
        const dbResult = await pool.request()
          .input('p_name', sql.NVarChar, req.body.name)
          .input('p_firstDibsUrl', sql.NVarChar, req.body.firstDibsUrl)
          .input('p_imageName', sql.NVarChar, String(req.body.imageName))
          .input('p_sold', sql.NVarChar, req.body.sold ? 'isSold' : null)
          .query(newQuery)
        res.send(dbResult.recordset)
      } catch (err) {
        console.log(err)
        res.status(400).send(err)
      }
    })
  } catch (error) { console.log(error) }
})

router.post('/item/set-status', async (req, res, next) => {

  // decrypt token
  try {
    const authResult = await verify(req.body.token)
    if (!authResult.verified) {
      return res.status(403).send({ error: 'Unauthorized' })
    }

    const query = `
          SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
          BEGIN TRAN

            IF EXISTS ( SELECT * FROM dbo.StoreItems WITH (UPDLOCK) WHERE ItemName = @p_name )

              UPDATE dbo.StoreItems
                SET Sold=@p_newStatus
              WHERE ItemName = @p_name;

          COMMIT`

    await poolConnect
    const result = await pool.request()
      .input('p_name', sql.NVarChar, req.body.name)
      .input('p_newStatus', sql.NVarChar, req.body.newStatus)
      .query(query)
    res.send(result.recordset)

  } catch (error) { console.log(error) }
})

module.exports = router;
