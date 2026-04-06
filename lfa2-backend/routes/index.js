const express = require('express');
const router = express.Router();
const cors = require('cors')
const { poolPromise } = require('../db-interface')
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
  let page = req.query.page
  let sort = req.query.sort
  let unsold = req.query.unsold

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

  const dbSort = sort === "recent" ? "image" : "item_name"
  const sortDir = dbSort === "item_name" ? "ASC" : "DESC"
  const offset = (parseInt(page) - 1) * parseInt(itemsPerPage)

  const query = `
    SELECT id, item_name, url, image, sold
    FROM store_items
    ${unsold === 'true' ? "WHERE sold = FALSE" : ""}
    ORDER BY ${dbSort} ${sortDir}
    LIMIT $1 OFFSET $2`

  try {
    const pool = await poolPromise
    const result = await pool.query(query, [parseInt(itemsPerPage), offset])
    res.send(result.rows)
  } catch (err) {
    console.log('Statement failed: ' + err)
    res.status(500).send(err)
  }
})

router.delete('/item/:id', async (req, res, next) => {
  try {
    const authResult = await verify(req.query.token)
    if (!authResult.verified) {
      return res.status(403).send({ error: 'Unauthorized' })
    }

    const pool = await poolPromise
    const result = await pool.query('DELETE FROM store_items WHERE id = $1', [parseInt(req.params.id)])
    res.send({ deleted: result.rowCount })
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

  const query = `
    SELECT COUNT(*) AS item_count
    FROM store_items
    ${unsold === 'true' ? "WHERE sold = FALSE" : ""}`

  try {
    const pool = await poolPromise
    const result = await pool.query(query)
    res.send(result.rows[0])
  } catch (err) {
    console.log('Statement failed: ' + err)
    res.status(500).send(err)
  }
})

router.get('/get-hero-image', async (req, res, next) => {
  let url = req.query.url

  if (url === undefined) {
    res.send({ error: "NO_URL_PROVIDED" })
  } else {
    let itemDetails = await firstDibsScraper.getProductHeroImage(url)
    res.send(itemDetails)
  }
})

router.get('/latest-image-reference', async (req, res, next) => {
  try {
    const pool = await poolPromise
    const result = await pool.query('SELECT * FROM store_items ORDER BY image DESC LIMIT 1')
    res.send(result.rows[0])
  } catch (err) {
    console.log('Statement failed: ' + err)
    res.status(500).send(err)
  }
})

router.post('/token-signin', async (req, res, next) => {
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
  try {
    const authResult = await verify(req.body.token)
    if (!authResult.verified) {
      return res.status(403).send({ error: 'Unauthorized' })
    }

    imageUploader.upload(req.body.cdnUrl, `${process.env.IMAGE_FOLDER}/${req.body.imageName}`, async (result) => {
      try {
        const pool = await poolPromise
        let dbResult

        if (req.body.id) {
          dbResult = await pool.query(
            `UPDATE store_items
             SET item_name = $1, url = $2, image = $3, sold = $4, date_added = NOW()
             WHERE id = $5`,
            [req.body.name, req.body.firstDibsUrl, req.body.imageName, !!req.body.sold, req.body.id]
          )
        } else {
          dbResult = await pool.query(
            `INSERT INTO store_items (item_name, url, image, sold, date_added)
             VALUES ($1, $2, $3, $4, NOW())`,
            [req.body.name, req.body.firstDibsUrl, req.body.imageName, !!req.body.sold]
          )
        }

        res.send({ rowCount: dbResult.rowCount })
      } catch (err) {
        console.log(err)
        res.status(400).send(err)
      }
    })
  } catch (error) { console.log(error) }
})

router.post('/item/set-status', async (req, res, next) => {
  try {
    const authResult = await verify(req.body.token)
    if (!authResult.verified) {
      return res.status(403).send({ error: 'Unauthorized' })
    }

    const pool = await poolPromise
    const result = await pool.query(
      'UPDATE store_items SET sold = $1 WHERE id = $2',
      [req.body.newStatus === 'isSold', req.body.id]
    )
    res.send({ rowCount: result.rowCount })
  } catch (error) { console.log(error) }
})

module.exports = router;
