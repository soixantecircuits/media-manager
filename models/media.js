var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Media = mongoose.model('media', {
  filename: String,
  path: String,
  type: String,
  bucketId: Schema.Types.ObjectId,
  URI: String,
  state: String,
  uploadedAt: Date,
  updatedAt: Date,
  meta: Object,
  details: Object
})

module.exports = Media
