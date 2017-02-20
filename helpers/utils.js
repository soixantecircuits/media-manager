'use strict'

const Media = require('../models/media')
const mh = require('media-helper')
const config = require('../config/config')
const path = require('path')
const spacebroClient = require('spacebro-client')

spacebroClient.connect('127.0.0.1', 8888, {
  clientName: 'media-moderator',
  channelName: 'media-stream',
  verbose: false
})

function createMedia (options) {
  return new Promise((resolve, reject) => {
    var newMedia = new Media()
    mh.getMimeType(options.file).then(type => {
      newMedia.meta = options.meta
      newMedia.bucketId = options.bucketId
      newMedia.uploadedAt = new Date().toISOString()
      newMedia.state = config.defaultState
      newMedia.type = type
      newMedia.path = path.dirname(options.file)
      newMedia.filename = path.basename(options.file)

      newMedia.save(err => {
        if (err) { console.log(err) } else {
          console.log('Added', newMedia._id, 'media')
          spacebroClient.emit('media-to-db', newMedia)
          resolve(newMedia)
        }
      })
    })
    .catch(error => reject(error))
  })
}

module.exports = {
  spacebroClient,
  createMedia
}
