'use strict'

const Media = require('../models/media')
const mh = require('media-helper')
const winston = require('winston')
const assignment = require('assignment')
const path = require('path')
const spacebroClient = require('spacebro-client')
const fs = require('fs-extra')
const moment = require('moment')
let settings = {}
let spacebroSettings = {}

var init = function (globalSettings) {
  settings = globalSettings
  spacebroSettings = settings.service.spacebro
  initSpacebroClient()
}

function initSpacebroClient () {
  spacebroClient.connect(spacebroSettings.host, spacebroSettings.port, {
    client: spacebroSettings.client,
    channelName: spacebroSettings.channelName,
    verbose: false
  })

  spacebroClient.on('connect', () => {
    console.log(`spacebro: ${spacebroSettings.client.name} connected to ${spacebroSettings.host}:${spacebroSettings.port}#${spacebroSettings.channelName}`)
  })

  spacebroClient.on('disconnect', () => {
    console.log(`spacebro: disconnected from ${spacebroSettings.host}:${spacebroSettings.port}`)
  })

  spacebroClient.on('newClient', (data) => {
    console.log(`spacebro: ${data.name} has joined.`)
  })

  spacebroClient.on(spacebroSettings.client.in.inMediaUpdate.eventName, (data) => {
    console.log(`spacebro: should update ${data._id}`)
    setMeta(data)
    spacebroClient.emit(spacebroSettings.client.out.outMediaUpdate.eventName, data.meta)
  })
}

function setMeta (media) {
  Media.findById(media._id, (err, mediaDoc) => {
    if (err) {
      winston.error(err)
    } else if (!mediaDoc) {
      winston.warn(`media: ${media._id} not found`)
    } else {
      Media.update(
        { _id: media._id },
        { $set: assignment(mediaDoc.toObject(), media) },
        (err, doc) => {
          if (err) {
            winston.error(err)
          } else {
            winston.log(`media - setMeta succeed for ${doc._id}`)
          }
        }
      )
    }
  })
}

function dateDir () {
  var today = moment().format('YYYY-MM-DD')
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
          spacebroClient.emit(spacebroSettings.client.out.outMedia.eventName, newMedia)
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
        spacebroClient.emit(spacebroSettings.client.out.outMediaDelete.eventName, {mediaId: id, bucketId: media.bucketId})
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
              spacebroClient.emit(spacebroSettings.client.out.outMediaDelete.eventName, {mediaId: media._id, bucketId: media.bucketId})
              winston.info('DELETE -', media._id.toString(), '-', media.path)
            }
          })
        }
      })
    }
  })
}

module.exports = {
  init,
  spacebroClient,
  dateDir,
  createMedia,
  deleteMedia,
  checkIntegrity
}
