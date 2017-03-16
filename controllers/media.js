'use strict'

const fs = require('fs-extra')
const path = require('path')
const download = require('download')
const mh = require('media-helper')
const express = require('express')
const router = express.Router()
const Media = require('../models/media')
const config = require('nconf').get()
const Utils = require('../helpers/utils')

// ----- GET ----- //
function getMediaCount (stateFilter) {
  return new Promise((resolve, reject) => {
    var criteria = (stateFilter === undefined) ? {} : {state: stateFilter}
    Media.count(criteria, (err, count) => {
      if (err) { reject(err) } else { resolve(count) }
    })
  })
}

router.get('/settings', function (req, res) {
  res.json(config)
})

router.get('/count', function (req, res) {
  res.contentType('text/plain')
  getMediaCount(req.query.state)
  .then(count => res.send(count.toString()))
  .catch(error => res.send(error))
})

router.get('/first', function (req, res) {
  Media.findOne().sort({uploadedAt: 1}).exec((err, media) => {
    if (err) { console.log(err) } else { res.json(media) }
  })
})

router.get('/last', function (req, res) {
  Media.findOne().sort({uploadedAt: -1}).exec((err, media) => {
    if (err) { console.log(err) } else { res.json(media) }
  })
})

router.get('/:id/export', function (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      res.send(err)
    } else if (media) {
      res.redirect(path.join('/static', media.path))
    } else {
      res.send({ error: 'Not found', id: req.params.id })
    }
  })
})

router.get('/:id/thumbnail', function (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      res.send(err)
    } else if (media) {
      if (media.details.thumbnail) {
        res.redirect(path.join('/static', media.details.thumbnail.source))
      } else {
        res.send({ error: 'Not found',
                   details: 'No thumbnail associated to this media',
                   id: req.params.id
                 })
      }
    } else {
      res.send({ error: 'Not found', id: req.params.id })
    }
  })
})

router.get('/:id/metas', function (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) { res.send(err) } else { res.json(media.meta) }
  })
})

router.get('/:id/:field', function (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      res.send(err)
    } else if (media) {
      res.json(media[req.params.field])
    } else {
      res.send({ error: 'Not found', id: req.params.id, field: req.params.field })
    }
  })
})

// ----- POST ----- //
router.post('/', function (req, res) {
  var media = req.body.media
  var filename = req.body.filename
  if (media === undefined) { res.send('Error: media field undefined') }
  if (filename === undefined) { res.send('Error: filename field undefined') }

  var relativePath = path.join(Utils.dateDir(), filename)
  var absolutePath = path.join(config.dataFolder, relativePath)
  mh.toBase64(media).then(data => {
    fs.writeFileSync(absolutePath, data, 'base64')
    Utils.createMedia({
      path: relativePath,
      meta: req.body.meta,
      bucketId: req.body.bucketId
    }).then(media => res.send(media))
  })
  .catch(error => res.send(error))
})

// ----- PUT ----- //
router.put('/:id', function (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) { res.send(err) } else {
      var spacebroData = {mediaId: media._id}
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
          if (err) { res.send(err) } else { console.log('UPDATE -', media._id) }
          Utils.spacebroClient.emit('media-updated', spacebroData)
        })
      }
      res.json(media)
    }
  })
})

// ----- DELETE ----- //
router.delete('/:id', function (req, res) {
  var id = req.params.id
  if (id) {
    Utils.deleteMedia(id)
    .then(media => fs.unlinkSync(path.join(config.dataFolder, media.path)))
    .catch(error => console.log(error))
  }
})

function toDataFolder(msg) {
  return new Promise((resolve, reject) => {

    let mediaRelativePath = path.join(Utils.dateDir(), msg.file)
    let mediaAbsolutePath = path.join(config.dataFolder, mediaRelativePath)
    let thumbnailRelativePath = path.join(Utils.dateDir(), msg.details.thumbnail.file)
    let thumbnailAbsolutePath = path.join(config.dataFolder, thumbnailRelativePath)

    if (mh.isFile(msg.path)) {
      console.log("--> Copying new media to " + path.dirname(mediaAbsolutePath))
      fs.copySync(msg.path, mediaAbsolutePath)
      fs.copySync(msg.details.thumbnail.source, thumbnailAbsolutePath)
      return resolve({ media: mediaRelativePath, thumbnail: thumbnailRelativePath })

    } else if (mh.isURL(msg.path)) {
      console.log("--> Downloading new media to " + path.dirname(mediaAbsolutePath))
      download(msg.path)
      .then(data => {
        fs.writeFileSync(mediaAbsolutePath, data)
        download(msg.details.thumbnail.source)
        .then(data => {
          fs.writeFileSync(thumbnailAbsolutePath, data)
          return resolve({ media: mediaRelativePath, thumbnail: thumbnailRelativePath })
        }).catch(err => reject(err))
      }).catch(err => reject(err))
    }
  })
}

// ----- SPACEBRO EVENTS ----- //
Utils.spacebroClient.on('new-media', function (data) {
  console.log('EVENT - "new-media" received')
  toDataFolder(data)
  .then(paths => {
    data.details.thumbnail.path = paths.thumbnail
    data.details.thumbnail.source = config.baseURL + 'static/' + paths.thumbnail
    Utils.createMedia({
      path: paths.media,
      meta: data.meta,
      details: data.details
    })
    .then(media => console.log('ADD -', media._id, '-', media.path))
    .catch(error => console.log(error))
  }).catch(error => console.log(error))
})

module.exports = router
