'use strict'

const Media = require('../models/media')
const mh = require('media-helper')
const winston = require('winston')
const assignment = require('assignment')
const settings = require('standard-settings').getSettings()
const spacebro = require('nconf').get('service:spacebro')
const path = require('path')
const spacebroClient = require('spacebro-client')
const fs = require('fs-extra')
const moment = require('moment')

spacebroClient.connect(spacebro.host, spacebro.port, {
  clientName: spacebro.client,
  channelName: spacebro.channel,
  verbose: false
})

spacebroClient.on('connect', () => {
  console.log(`spacebro: ${spacebro.client} connected to ${spacebro.host}:${spacebro.port}#${spacebro.channel}`)
})

spacebroClient.on('disconnect', () => {
  console.log(`spacebro: disconnected from ${spacebro.host}:${spacebro.port}`)
})

spacebroClient.on('new-member', (data) => {
  console.log(`spacebro: ${data.member} has joined.`)
})

spacebroClient.on('media-update', (data) => {
  console.log(`spacebro: should update ${data._id}`)
  setMeta(data)
  spacebroClient.emit('media-updated', data.meta)
})

function setMeta (media) {
  Media.findById(media._id, (err, mediaDoc) => {
    if (err) {
      winston.error(err)
    } else if (!mediaDoc) {
      winston.warn(`media: ${media._id} not found`)
    } else {
      Media.update({
        _id: media._id
      }, {
        $set: assignment(mediaDoc.toObject(), media)
      }, (err, doc) => {
        if (err) {
          winston.error(err)
        } else {
          winston.log(`media - setMeta succeed for ${doc._id}`)
        }
      })
    }
  })
}

function dateDir () {
  var today = moment().format('YYYY-MMMM-DD')
  fs.ensureDirSync(path.join(settings.folder.data, today))
  return (today)
}

function createMedia (data) {
  return new Promise((resolve, reject) => {
    var absolutePath = data.path
    mh.getMimeType(absolutePath).then((type) => {
      data.uploadedAt = new Date().toISOString()
      data.updatedAt = new Date().toISOString()
      data.state = settings.defaultState
      data.type = type
      data.file = path.basename(data.path)
      var newMedia = new Media(data)
      newMedia.save((err) => {
        if (err) { winston.error(err) } else {
          spacebroClient.emit('media-to-db', newMedia)
          resolve(newMedia)
        }
      })
    })
    .catch((error) => reject(error))
  })
}

function deleteMedia (id) {
  return new Promise((resolve, reject) => {
    Media.findByIdAndRemove(id, function (err, media) {
      if (err) { reject(err) } else if (media) {
        spacebroClient.emit('media-deleted', {mediaId: id, bucketId: media.bucketId})
        winston.info('DELETE -', id, '-', media.path)
        resolve(media)
      }
    })
  })
}

function checkIntegrity () {
  Media.find().exec((err, medias) => {
    if (err) { return winston.error(err) } else {
      medias.forEach((media) => {
        var mediaPath = path.join(settings.folder.data, media.path)
        if (mh.isFile(mediaPath) === false) {
          Media.findByIdAndRemove(media._id, function (err, media) {
            if (err) { return console.log(err) } else {
              spacebroClient.emit('media-deleted', {mediaId: media._id, bucketId: media.bucketId})
              winston.info('DELETE -', media._id.toString(), '-', media.path)
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
