'use strict'

const fs = require('fs-extra')
const path = require('path')
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
      res.redirect(path.join('/static', media.source))
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
    .then(media => fs.unlinkSync(path.join(config.dataFolder, media.source)))
    .catch(error => console.log(error))
  }
})

// ----- SPACEBRO EVENTS ----- //
Utils.spacebroClient.on('new-media', function (data) {
  let mediaRelativePath = path.join(Utils.dateDir(), data.file)
  let mediaAbsolutePath = path.join(config.dataFolder, mediaRelativePath)
  let thumbnailRelativePath = path.join(Utils.dateDir(), data.details.thumbnail.file)
  let thumbnailAbsolutePath = path.join(config.dataFolder, thumbnailRelativePath)

  fs.copySync(data.path, mediaAbsolutePath)
  fs.copySync(data.details.thumbnail.source, thumbnailAbsolutePath)
  data.details.thumbnail.source = thumbnailRelativePath
  Utils.createMedia({
    path: mediaRelativePath,
    meta: data.meta,
    details: data.details
  })
  .catch(error => console.log(error))
})

module.exports = router
