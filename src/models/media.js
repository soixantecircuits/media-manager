'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Media = mongoose.model('media', {
  file: String,
  path: String,
  url: String,
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
