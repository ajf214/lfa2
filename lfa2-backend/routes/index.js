const express = require('express');
const router = express.Router();
const cors = require('cors')
const dbInterface = require('../db-interface')
const db = new dbInterface()
const firstDibsScraper = require('../first-dibs-scraper')
const imageUploader = require('../image-uploader')
require('dotenv').config()

const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.GSUITE_CLIENT_ID)

async function verify(token) {
  const ticket = await client.verifyIdToken({
      idToken: token,
      // audience: process.env.GSUITE_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });

  // If request specified a G Suite domain:
  // const domain = payload['hd'];
  
  return ticket.getPayload();
}

// enable cors for all routes
router.use(cors())
router.options('*', cors())

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('LFA2 Backend -- Nothing has been requested')
});

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
  query = `
    DECLARE @PageNumber AS INT, @RowspPage AS INT 
    SET @PageNumber = ${page} 
    SET @RowspPage = 18 
    SELECT ItemName, Url, CAST(Image AS INT) AS Image, Sold 
    FROM dbo.StoreItems 
    ${unsold === 'true' ? "WHERE Sold != 'isSold'" : ""} 
    ORDER BY ${dbSort} ${dbSort === "ItemName" ? "asc" : "desc"} 
    OFFSET ((@PageNumber - 1) * @RowspPage) 
    ROWS FETCH NEXT @RowspPage ROWS ONLY;`
  db.getData(query, results => {
    // called after db request is done...
    console.log(`successfully returned ${results.length} items`)
    res.send(results)
  })
})

// returns COUNT of all items in db, used to calculate number of pages
router.get('/all-items', (req, res, next) => {
  let unsold = req.query.unsold
  if (unsold === undefined) {
    unsold === "false"
  }

  query = `select count(*) as ItemCount 
  from dbo.StoreItems
  ${unsold === 'true' ? "WHERE Sold != 'isSold'" : ""}`
  db.getData(query, results => {
    console.log(`successfully returned:`)
    console.log(results[0])
    res.send(results[0])
  })
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
  db.getData(query, results => {
    res.send(results[0])
  })
})

// upload image to cloudinary and create item in DB
// TODO - this needs to be an authenticated request!
router.post('/item', async (req, res, next) => {
  
  // decrypt token
  try {
    console.log('Attempting to verify credentials...')
    console.log(req.body)
    const userPayload = await verify(req.body.token)

    // check that they are auth'd to whatever the standard is
    // should be jill or alex only
    // if they are not verified I should send a 403
    console.log(`User verified -- User: ${userPayload.name}`)


    console.log('Attempting image upload...')
    console.log(process.env.cloudinary_api_secret)
    // upload image to cloudinary    
    imageUploader.upload(req.body.cdnUrl, `${process.env.IMAGE_FOLDER}/${req.body.imageName}`, (result) => {
      // callback after upload finishes (todo - successfully?)
      console.log(result)
      
      // todo - need to use a real date
      newQuery = `
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN TRAN
      
          IF EXISTS ( SELECT * FROM dbo.StoreItems WITH (UPDLOCK) WHERE ItemName = '${req.body.name}' )
      
            UPDATE dbo.StoreItems
              SET Url='${req.body.firstDibsUrl}', 
               Image='${req.body.imageName}', 
               Sold='${req.body.sold}', 
               DateAdded='2020-06-01'
            WHERE ItemName = '${req.body.name}';
      
          ELSE 
            INSERT dbo.StoreItems (ItemName, Url, Image, Sold, DateAdded) 
          VALUES ('Random Dev Item abc', '${req.body.firstDibsUrl}', '${req.body.imageName}', '${req.body.sold}', '2020-06-01')
      
        COMMIT
      `

      // if successful, create item in db
      // todo - how do I guard against SQL injection?
      // query = `insert into dbo.StoreItems (ItemName, Url, Image, Sold, DateAdded) 
      //   VALUES ('${req.body.name}', '${req.body.firstDibsUrl}', '${req.body.imageName}', '${req.body.sold}', '2020-03-15')`
      console.log(newQuery)
      db.getData(newQuery, results => {
        console.log(results)
        
        // if there is an error in the results
        if(results.code === 'EREQUEST') {
          // todo - what if it is something besides a 400?
          // could hit a 403 if user was not verified..
          console.log('im an error!')
          res.status(400).send(results); 
        }
        
        // if results are good, send goodness
        else {
          res.send(results)
        }
      })
    })
  } catch (error) { console.log(error) }
})

module.exports = router;
