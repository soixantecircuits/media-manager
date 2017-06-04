'use strict'

const fs = require('fs-extra')
const path = require('path')
const download = require('download')
const async = require('async')
const mh = require('media-helper')
const winston = require('winston')
const uuidV4 = require('uuid/v4')
const Media = require('../models/media')
const settings = require('nconf').get()
const Utils = require('../helpers/utils')

function notFound (id) {
  let error = 'Media not found'
  winston.warn(error, { id: id })
  return { error: error, id: id }
}

function emptyField (field, id) {
  let error = 'Empty field'
  winston.warn(error, { field: field, id: id })
  return { error: error, field: field, id: id }
}

function getMediaCount (stateFilter) {
  return new Promise((resolve, reject) => {
    var criteria = (stateFilter === undefined) ? {} : { state: stateFilter }
    Media.count(criteria, (err, count) => {
      if (err) { reject(err) } else { resolve(count) }
    })
  })
}

function getSettings (req, res) {
  res.json(settings)
}

function getCount (req, res) {
  res.contentType('text/plain')
  getMediaCount(req.query.state)
    .then(count => res.send(count.toString()))
    .catch(error => res.send(error))
}

function getFirst (req, res) {
  Media.findOne().sort({ uploadedAt: 1 }).exec((err, media) => {
    if (err) {
      winston.error(err)
      res.send(err)
    } else if (!media) {
      res.send(notFound())
    } else { res.json(media) }
  })
}

function getLast (req, res) {
  Media.findOne().sort({ uploadedAt: 1 }).exec((err, media) => {
    if (err) {
      winston.error(err)
      res.send(err)
    } else if (!media) {
      res.send(notFound())
    } else { res.json(media) }
  })
}

function getMedia (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      winston.error(err)
      res.send(err)
    } else if (!media) {
      res.send(notFound(req.params.id))
    } else {
      res.redirect(path.join('/static', media.path))
    }
  })
}

function getThumbnail (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      winston.error(err)
      res.send(err)
    } else if (media) {
      if (media.details.thumbnail) {
        res.redirect(path.join('/static', media.details.thumbnail.url))
      } else { res.send(emptyField('details.thumbnail', req.params.id)) }
    } else { res.send(notFound(req.params.id)) }
  })
}

function getField (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      winston.error(err)
      res.send(err)
    } else if (!media) {
      res.send(notFound(req.params.id))
    } else {
      if (media[req.params.field] !== undefined) {
        res.json(media[req.params.field])
      } else { res.send(emptyField(req.params.field, req.params.id)) }
    }
  })
}

function postMedia (req, res) {
  var media = req.body.media
  var filename = req.body.filename
  if (media === undefined) { res.send(emptyField('media')) }
  if (filename === undefined) { res.send(emptyField('filename')) }

  var relativePath = path.join(Utils.dateDir(), filename)
  var absolutePath = path.join(settings.folder.data, relativePath)
  mh.toBase64(media).then(data => {
    fs.writeFileSync(absolutePath, data, 'base64')
    Utils.createMedia({
      path: relativePath,
      meta: req.body.meta,
      bucketId: req.body.bucketId
    })
      .then(media => {
        winston.info('ADD -', media._id, '-', media.path)
        res.send(media)
      })
      .catch(error => res.send(error))
  })
    .catch(error => res.send(error))
}

function updateMedia (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      winston.error(err)
      res.send(err)
    } else if (!media) {
      res.send(notFound(req.params.id))
    } else {
      var spacebroData = { mediaId: media._id }
      if (req.body.state && req.body.state !== media.state) {
        media.state = req.body.state
        spacebroData['newState'] = media.state
      }
      if (req.body.bucketId && req.body.bucketId !== media.bucketId) {
        media.bucketId = req.body.bucketId
        spacebroData['newBucketId'] = media.bucketId
      }
      if (req.body.state || req.body.bucketId) {
        media.updatedAt = new Date().toISOString()
        media.save(err => {
          if (err) {
            winston.error(err)
            res.send(err)
          } else {
            winston.info('UPDATE -', media._id.toString())
            Utils.spacebroClient.emit('media-updated', spacebroData)
          }
        })
      }
      res.json(media)
    }
  })
}

function updateMeta (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      winston.error(err)
      res.send(err)
    } else if (!media) {
      res.send(notFound(req.params.id))
    } else {
      const meta = Object.assign({}, media.meta, req.body)
      media.meta = meta
      media.updatedAt = new Date().toISOString()
      media.save(err => {
        if (err) {
          winston.error(err)
          res.send(err)
        } else {
          winston.info('UPDATE META -', media._id.toString())
          Utils.spacebroClient.emit('media-updated', meta)
        }
      })
      res.json(media)
    }
  })
}

function deleteMedia (req, res) {
  var id = req.params.id
  Utils.deleteMedia(id)
    .then(media => {
      fs.unlinkSync(path.join(settings.folder.data, media.path))
      res.send(media)
    })
    .catch(error => {
      winston.error(error)
      res.send(error)
    })
}

function copyOrDownload (msg) {
  return new Promise((resolve, reject) => {
    console.log('start copyOrDownload process...')
    msg.file = msg.file || path.basename(msg.path)
    var basename = path.basename(msg.file)
    var mediaRelativePath = path.join(Utils.dateDir(),  basename + '-' + uuidV4()) + path.extname(msg.file)
    var mediaAbsolutePath = path.join(settings.folder.data, mediaRelativePath)
    // Copy the media to the disk
    if (mh.isFile(msg.path)) {
      winston.info('Copying file ' + msg.file + ' to ' + mediaRelativePath)
      try {
        fs.copySync(msg.path, mediaAbsolutePath)
        msg.path = mediaAbsolutePath
        msg.url = settings.baseURL + 'static/' + mediaRelativePath
        winston.info('Done copying file ' + msg.file + ' to ' + mediaRelativePath)
        resolve(msg)
      } catch (err) {
        reject(err)
      }
    } else if (mh.isURL(msg.path) || mh.isURL(msg.url)) {
      winston.info('Downloading file ' + msg.file + ' to ' + mediaRelativePath)
      download(mh.isURL(msg.path) ? msg.path : msg.url)
        .then(data => {
          try {
            fs.writeFileSync(mediaAbsolutePath, data)
            msg.path = mediaAbsolutePath
            msg.url = settings.baseURL + 'static/' + mediaRelativePath
            winston.info('Done downloading file ' + msg.file + ' to ' + mediaRelativePath)
            resolve(msg)
          } catch (err) {
            reject(err)
          }
        }).catch(err => reject(err))
    } else if (mh.isBase64(msg.path) || mh.isBase64(msg.url)) {
      winston.info('Creating file ' + msg.file + ' to ' + mediaRelativePath)
      try {
        let base64Data = msg.url.replace(/^data:image\/png;base64,/, '')
        fs.writeFileSync(mediaAbsolutePath, base64Data, 'base64')
        msg.path = mediaAbsolutePath
        msg.url = settings.baseURL + 'static/' + mediaRelativePath
        winston.info('Done creating file ' + msg.file + ' to ' + mediaRelativePath)
        resolve(msg)
      } catch (err) {
        reject(err)
      }
    } else {
      let msgError = `Error: Could not find a path or URL to the file ${msg.file}.`
      console.error(msgError)
      reject(new Error(msgError))
    }
  })
}

function toDataFolder (msg) {
  return new Promise((resolve, reject) => {

    copyOrDownload(msg)
      .catch(err => reject(err))

    // Check for files to import from media details and copy them to the disk
    async.eachOf(msg.details, function (mediaVersion, key, callback) {
      if (typeof mediaVersion === 'object' && (mediaVersion.path || mediaVersion.url)) {
        copyOrDownload(mediaVersion) 
        .then(data => callback())
        .catch(err => callback(err))
      } else {
        callback()
      }
    }, (err) => {
      if (err) {
        reject(err)
      } else {
        winston.info('Done copying/downloading files and details for media ' + msg.file)
        resolve(msg)
      }
    })
  })
}

// ----- SPACEBRO EVENTS ----- //
Utils.spacebroClient.on('new-media', function (data) {
  winston.info('EVENT - "new-media" received')
  toDataFolder(data)
    .then(data => {
      Utils.createMedia(data)
        .then(media => winston.info('ADD -', media._id, '-', media.path))
        .catch(error => winston.error(error))
    }).catch(error => winston.error(error))
})

module.exports = {
  getSettings,
  getCount,
  getFirst,
  getLast,
  getMedia,
  getThumbnail,
  getField,
  postMedia,
  updateMedia,
  updateMeta,
  deleteMedia
}
