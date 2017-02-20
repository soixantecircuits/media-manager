var mongoose = require('mongoose')

var Bucket = mongoose.model('bucket', {
  name: String,
  slug: String,
  medias: Object,
  createdAt: Date
})

module.exports = Bucket
