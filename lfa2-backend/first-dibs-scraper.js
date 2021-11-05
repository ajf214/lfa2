const axios = require("axios")
const cheerio = require('cheerio')

async function getProductHeroImage(url) {
    
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const imageElements = $('img')

    let matches = []

    Array.prototype.forEach.call(imageElements, element => {
        if (element.attribs['data-tn'] !== undefined && element.attribs['data-tn'] === 'pdp-hero-carousel-image') {
            matches.push(element)
        }
    })

    console.log(`CDN SOURCE: ${matches[0].attribs.src}`)
    return matches[0].attribs.src
} 

module.exports = {
    getProductHeroImage
} 
