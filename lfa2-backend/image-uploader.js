require('dotenv').config();
var cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: "dqbr44qlr",
  api_key: "953131244342615",
  api_secret: process.env.CLOUDINARY_API_SECRET
})

function upload(file, filename, callback) {
  cloudinary.uploader.upload(file, { public_id: filename })
    .then(function (image) {
      console.log()
      console.log("** File Upload (Promise)")
      console.log("* " + image.public_id)
      console.log("* " + image.url)
      callback({ id: image.public_id, url: image.url })
    })
    .catch(function (err) {
      console.log()
      console.log("** File Upload (Promise)")
      if (err) {
        console.warn(err)
        callback(err)
      }
    });
}

module.exports = {
  upload
}