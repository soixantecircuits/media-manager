'use strict'

var mongoose = require('mongoose')

var Bucket = mongoose.model('bucket', {
  name: String,
  slug: String,
  medias: Array,
  createdAt: Date
})

module.exports = Bucket
