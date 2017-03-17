'use strict'

const Media = require('../models/media')
const mh = require('media-helper')
const config = require('nconf').get()
const path = require('path')
const spacebroClient = require('spacebro-client')
const fs = require('fs-extra')
const moment = require('moment')

spacebroClient.connect(config.spacebro.address, config.spacebro.port, {
  clientName: config.spacebro.clientName,
  channelName: config.spacebro.channelName,
  verbose: false
})

function dateDir () {
  var today = moment().format('YYYY-MMMM-DD')
  fs.ensureDirSync(path.join(config.dataFolder, today))
  return (today)
}

function createMedia (options) {
  return new Promise((resolve, reject) => {
    var newMedia = new Media()
    var absolutePath = path.join(config.dataFolder, options.path)
    mh.getMimeType(absolutePath).then(type => {
      newMedia.meta = options.meta
      newMedia.bucketId = options.bucketId
      newMedia.uploadedAt = new Date().toISOString()
      newMedia.state = config.defaultState
      newMedia.type = type
      newMedia.path = options.path
      newMedia.source = config.baseURL + 'static/' + options.path
      newMedia.file = path.basename(options.path)
      newMedia.details = options.details
      newMedia.save(err => {
        if (err) { console.log(err) } else {
          spacebroClient.emit('media-to-db', newMedia)
          resolve(newMedia)
        }
      })
    })
    .catch(error => reject(error))
  })
}

function deleteMedia (id) {
  return new Promise((resolve, reject) => {
    Media.findByIdAndRemove(id, function (err, media) {
      if (err) { reject(err) } else if (media) {
        spacebroClient.emit('media-deleted', {mediaId: id, bucketId: media.bucketId})
        console.log('DELETE -', id, '-', media.path)
        resolve(media)
      }
    })
  })
}

function checkIntegrity () {
  Media.find().exec((err, medias) => {
    if (err) { return console.log(err) } else {
      medias.forEach(media => {
        var mediaPath = path.join(config.dataFolder, media.path)
        if (mh.isFile(mediaPath) === false) {
          Media.findByIdAndRemove(media._id, function (err, media) {
            if (err) { return console.log(err) } else {
              spacebroClient.emit('media-deleted', {mediaId: media._id, bucketId: media.bucketId})
              console.log('DELETE -', media._id.toString(), '-', media.path)
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
