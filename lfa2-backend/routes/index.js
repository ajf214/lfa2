const express = require('express');
const router = express.Router();
const cors = require('cors')
const dbInterface = require('../db-interface')
const db = new dbInterface()
const firstDibsScraper = require('../first-dibs-scraper')
const imageUploader = require('../image-uploader')
require('dotenv').config()
const TYPES = require('tedious').TYPES

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

// enable cors for all routes
router.use(cors())
router.options('*', cors())

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
router.get('/items', (req, res, next) => {
  // get page query param
  let page = req.query.page
  let sort = req.query.sort
  let unsold = req.query.unsold

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
    SET @RowspPage = 18 
    SELECT ItemName, Url, CAST(Image AS INT) AS Image, Sold 
    FROM dbo.StoreItems 
    ${unsold === 'true' ? "WHERE Sold != 'isSold'" : ""} 
    ORDER BY ${dbSort} ${dbSort === "ItemName" ? "asc" : "desc"} 
    OFFSET ((@PageNumber - 1) * @RowspPage) 
    ROWS FETCH NEXT @RowspPage ROWS ONLY;`
  
  const request = db.constructRequest(query, results => {
    res.send(results)
  })
  request.addParameter('p_page', TYPES.Int, page)
  db.getData(request, results => {
    res.send(results)
  })
})

router.delete('/item/:image', (req, res, next) => {
  const query = `
  DELETE FROM dbo.StoreItems
  WHERE Image=@p_image 
  `

  const request = db.constructRequest(query, results => {
    res.send(results)
  })
  request.addParameter('p_image', TYPES.NVarChar, req.params.image)

  db.getData(request)
})

// returns COUNT of all items in db, used to calculate number of pages
router.get('/all-items', (req, res, next) => {
  let unsold = req.query.unsold
  if (unsold === undefined) {
    unsold === "false"
  }

  const query = `select count(*) as ItemCount 
  from dbo.StoreItems
  ${unsold === 'true' ? "WHERE Sold != 'isSold'" : ""}`
  
  const request = db.constructRequest(query, results => {
    res.send(results[0])
  })
  
  db.getData(request)
})

router.get('/get-hero-image', async (req, res, next) => {
  let url = req.query.url

  if (url === undefined) {
    res.send({ error: "NO_URL_PROVIDED" })
  } else {
    let imageUrl = await firstDibsScraper.getProductHeroImage(url)
    res.send({ cdnUrl: imageUrl })
  }
})

router.get('/latest-image-reference', (req, res, next) => {
  const query = `select top(1) * from dbo.StoreItems ORDER BY CONVERT(int, Image) desc`
  
  const request = db.constructRequest(query, results => {
    res.send(results[0])
  })
  db.getData(request)
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
    await verify(req.body.token)

    // upload image to cloudinary    
    imageUploader.upload(req.body.cdnUrl, `${process.env.IMAGE_FOLDER}/${req.body.imageName}`, (result) => {
      // callback after upload finishes (todo - successfully? no!)

      // todo - need to use a real date
      const newQuery = `
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN TRAN
      
          IF EXISTS ( SELECT * FROM dbo.StoreItems WITH (UPDLOCK) WHERE ItemName = @p_name )
      
            UPDATE dbo.StoreItems
              SET Url=@p_firstDibsUrl, 
               Image=@p_imageName, 
               Sold=@p_sold, 
               DateAdded='2020-06-01'
            WHERE ItemName = @p_name;
      
          ELSE 
            INSERT dbo.StoreItems (ItemName, Url, Image, Sold, DateAdded) 
          VALUES (@p_name, @p_firstDibsUrl, @p_imageName, @p_sold, '2020-06-01')
      
        COMMIT
      `

      const request = db.constructRequest(newQuery, results => {

        // if there is an error in the results
        if (results.code === 'EREQUEST') {
          // todo - what if it is something besides a 400?
          // could hit a 403 if user was not verified..
          console.log(results)
          res.status(400).send(results);
        }

        // if results are good, send goodness
        else {
          res.send(results)
        }
      })

      request.addParameter('p_name', TYPES.NVarChar, req.body.name)
      request.addParameter('p_firstDibsUrl', TYPES.NVarChar, req.body.firstDibsUrl)
      request.addParameter('p_imageName', TYPES.NVarChar, req.body.imageName)
      request.addParameter('P_sold', TYPES.NVarChar, req.body.sold)

      // if successful, create item in db
      // todo - how do I guard against SQL injection?ß
      db.getData(request)
    })
  } catch (error) { console.log(error) }
})

router.post('/item/set-status', async (req, res, next) => {

  // decrypt token
  try {
    await verify(req.body.token)

    const query = `
          SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
          BEGIN TRAN
        
            IF EXISTS ( SELECT * FROM dbo.StoreItems WITH (UPDLOCK) WHERE ItemName = @p_name )
        
              UPDATE dbo.StoreItems
                SET Sold=@p_newStatus
              WHERE ItemName = @p_name;
                
          COMMIT`

    /*
    ${req.body.name}
    ${req.body.newStatus}
    ${req.body.name}
    */
    const request = db.constructRequest(query, results => {
      // if there is an error in the results
      if (results.code === 'EREQUEST') {
        // todo - what if it is something besides a 400?
        // could hit a 403 if user was not verified..
        console.log(results)
        res.status(400).send(results);
      }

      // if results are good, send goodness
      else {
        res.send(results)
      }
    })

    request.addParameter('p_name', TYPES.NVarChar, req.body.name)
    request.addParameter('p_newStatus', TYPES.NVarChar, req.body.newStatus)
    
    db.getData(request)

  } catch (error) { console.log(error) }
})

module.exports = router;
