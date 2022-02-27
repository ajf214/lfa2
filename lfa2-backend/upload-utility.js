const imageUploader = require('./image-uploader')
require('dotenv').config()

for (i = 276; i < 277; i++) {
    imageUploader.upload(`/Users/adotfrank/Downloads/lfa-images/${i}.jpeg`, `lfa-items/${i}`, (result) => {
        console.log(result)
    })
}
