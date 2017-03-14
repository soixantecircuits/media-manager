'use strict'

const Media = require('../models/media')
const mh = require('media-helper')
const config = require('nconf').get()
const path = require('path')
const spacebroClient = require('spacebro-client')
const fs = require('fs-extra')
const moment = require('moment')

spacebroClient.connect(config.spacebro.address, config.spacebro.port, {
  clientName: 'media-manager',
  channelName: 'media-stream',
  verbose: false
})

function dateDir () {
  var today = moment().format("YYYY-MMMM-DD")
  fs.ensureDirSync(path.join(config.dataFolder, today))
  return (today)
}

function createMedia (options) {
  return new Promise((resolve, reject) => {
    var newMedia = new Media()
    var absolutePath = path.join(config.dataFolder, options.file)
    mh.getMimeType(absolutePath).then(type => {
      newMedia.meta = options.meta
      newMedia.bucketId = options.bucketId
      newMedia.uploadedAt = new Date().toISOString()
      newMedia.state = config.defaultState
      newMedia.type = type
      newMedia.path = path.dirname(options.file)
      newMedia.filename = path.basename(options.file)
      newMedia.details = options.details
      newMedia.save(err => {
        if (err) { console.log(err) } else {
          console.log('ADD -', newMedia._id, '-', path.join(newMedia.path, newMedia.filename))
          spacebroClient.emit('media-to-db', newMedia)
          resolve(newMedia)
        }
      })
    })
    .catch(error => reject(error))
  })
}

function deleteMedia(id) {
  return new Promise((resolve, reject) => {
    Media.findByIdAndRemove(id, function (err, media) {
      if (err) { reject(err) }
      else if (media) {
        spacebroClient.emit('media-deleted', {mediaId: id, bucketId: media.bucketId})
        console.log('DELETE -', id, '-', path.join(media.path, media.filename))
        resolve(media)
      }
    })
  })
}

function checkIntegrity() {
  Media.find().exec((err, medias) => {
    if (err) { return console.log(err) } else {
      medias.forEach(media => {
        var mediaPath = path.join(config.dataFolder, media.path, media.filename)
        if (mh.isFile(mediaPath) === false) {
          Media.findByIdAndRemove(media._id, function (err, media) {
            if (err) { return console.log(err) } else {
              spacebroClient.emit('media-deleted', {mediaId: media._id, bucketId: media.bucketId})
              console.log(media._id.toString(), 'has been deleted: file not found')
            }
          })
        }
      })
    }
  })
}

module.exports = {
  spacebroClient,
  dateDir,
  createMedia,
  deleteMedia,
  checkIntegrity
}
