'use strict'

const fs = require('fs-extra')
const path = require('path')
const download = require('download')
const async = require('async')
const mh = require('media-helper')
const winston = require('winston')
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

function toDataFolder (msg) {
  return new Promise((resolve, reject) => {
    msg.file = msg.file || path.basename(msg.path)
    let mediaRelativePath = path.join(Utils.dateDir(), msg.file)
    let mediaAbsolutePath = path.join(settings.folder.data, mediaRelativePath)

    var res = {
      media: mediaRelativePath
    }

    // Copy the media to the disk
    if (mh.isFile(msg.path)) {
      winston.info('Copying new media to ' + path.dirname(mediaAbsolutePath) + ' folder')
      try {
        fs.copySync(msg.path, mediaAbsolutePath)
      } catch (err) {
        return reject(err)
      }
    } else if (mh.isURL(msg.path) || mh.isURL(msg.url)) {
      winston.info('Downloading new media to ' + path.dirname(mediaAbsolutePath) + ' folder')
      download(mh.isURL(msg.path) ? msg.path : msg.url)
        .then(data => {
          try {
            fs.writeFileSync(mediaAbsolutePath, data)
          } catch (err) {
            return reject(err)
          }
        }).catch(err => reject(err))
    } else {
      return reject(new Error(`Error: Could not find a path or URL to the file ${msg.file}.`))
    }

    // Check for files to import from media details and copy them to the disk
    async.eachOf(msg.details, function (mediaVersion, key, callback) {
      if (typeof mediaVersion === 'object' && (mediaVersion.path || mediaVersion.url)) {
        mediaVersion.file = mediaVersion.file || path.basename(mediaVersion.path)
        let versionFile = mediaVersion.file || mediaVersion.url.split('/').slice(-1)[0]
        let versionRelativePath = path.join(Utils.dateDir(), versionFile)
        let versionAbsolutePath = path.join(settings.folder.data, versionRelativePath)

        if (mh.isFile(mediaVersion.path)) {
          try {
            fs.copySync(mediaVersion.path, versionAbsolutePath)
          } catch (err) {
            return callback(err)
          }
          res[key] = versionRelativePath
          return callback()
        } else if (mh.isURL(mediaVersion.path) || mh.isURL(mediaVersion.url)) {
          download(mh.isURL(mediaVersion.path) ? mediaVersion.path : mediaVersion.url)
            .then(data => {
              try {
                fs.writeFileSync(versionAbsolutePath, data)
              } catch (err) {
                return callback(err)
              }
              res[key] = versionRelativePath
              return callback()
            })
            .catch(err => callback(err))
        } else {
          return callback()
        }
      }
    }, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

// ----- SPACEBRO EVENTS ----- //
Utils.spacebroClient.on('new-media', function (data) {
  winston.info('EVENT - "new-media" received')
  toDataFolder(data)
    .then(paths => {
      data.details = data.details || {}
      for (let key in paths) {
        if (key !== 'media') {
          data.details[key] = data.details[key] || {}
          data.details[key].path = paths[key]
          data.details[key].url = settings.baseURL + 'static/' + paths[key]
        }
      }
      Utils.createMedia({
        path: paths.media,
        meta: data.meta,
        details: data.details
      })
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
