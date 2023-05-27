const axios = require("axios")
const cheerio = require('cheerio')

async function getProductHeroImage(url) {
    
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    
    const itemName = $('div[data-tn="pdp-main-title"]').contents()[0].data
    const imageElements = $('img[data-tn="pdp-hero-carousel-image"]')
    
    if (imageElements[0] !== undefined) {
        console.log(`CDN SOURCE: ${imageElements[0].attribs.src}`)
        return {
            cdnUrl: imageElements[0].attribs.src,
            itemName: itemName,
            sold: false
        }
    } else {
        // for some reason, when item is sold, the img no longer has the "data-tn" attribute
        // test case when item is sold: http://localhost:3000/get-hero-image?url=https://www.1stdibs.com/furniture/dining-entertaining/barware/silver-plate-louis-roederer-champagne-bucket-france-circa-1920/id-f_23395152/&itemName=Silver%20Plate%20Louis%20Roederer%20Champagne%20Bucket%2C%20France%2C%20circa%201920
        const imagesFromCarousel = $(`img[alt="${itemName}"]`)
        
        if (imagesFromCarousel[1] !== undefined) {
            return {
                cdnUrl: imagesFromCarousel[1].attribs.src,
                itemName: itemName,
                sold: true
            }
        } else {
            return {
                cdnUrl: 'NoMatch',
                itemName: 'NoMatch',
                sold: false
            }
        }
    }
    
} 

module.exports = {
    getProductHeroImage
} 
