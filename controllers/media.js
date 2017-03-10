'use strict'

const fs = require('fs')
const path = require('path')
const mh = require('media-helper')
const express = require('express')
const router = express.Router()
const Media = require('../models/media')
const config = require('../config/config')
const Utils = require('../helpers/utils')

// To be deleted //
router.delete('/all', function (req, res) {
  Media.remove({},
    (err, media) => {
      if (err) { res.send(err) } else { res.send('Successfully deleted medias') }
    })
})

// ----- GET ----- //
function getMediaCount (stateFilter) {
  return new Promise((resolve, reject) => {
    var criteria = (stateFilter === undefined) ? {} : {state: stateFilter}
    Media.count(criteria, (err, count) => {
      if (err) { reject(err) } else { resolve(count) }
    })
  })
}

router.get('/config', function (req, res) {
  var config = require('../config/config.json')
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

router.get('/:id', function (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      res.send(err)
    } else {
      if (media.path === config.uploads) {
        res.redirect('/uploads/' + media.filename)
      } else if (media.path === config.chokibroFolder) {
        res.redirect('/chokibro/' + media.filename)
      }
    }
  })
})

// This route is depreciated //
router.get('/:id/old', function (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      res.send(err)
    } else if (media === null) {
      res.send({error: 'Media not found'})
    } else {
      if (typeof media.path !== 'string' || typeof media.filename !== 'string') {
        res.send({ error: 'Error while getting the path', details: 'Media path or filename is not a string.' })
      } else {
        var mediaPath = path.join(media.path, media.filename)
        if (fs.existsSync(mediaPath)) {
          var data = fs.readFileSync(mediaPath)
          res.contentType(media.type)
          res.send(data)
        } else {
          res.send({ error: 'File does not exist' })
        }
      }
    }
  })
})

router.get('/thumbnail/:id', function (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) {
      res.send(err)
    } else if (media === null) {
      res.send({error: 'Media not found'})
    } else {
      var details = media.mediaDetails
      if (!details || !details.thumbnail || typeof details.thumbnail.path !== 'string') {
        res.send({ error: 'Error while getting the path', details: 'Media path or filename is not a string.' })
      } else {
        var mediaPath = details.thumbnail.path
        if (fs.existsSync(mediaPath)) {
          var data = fs.readFileSync(mediaPath)
          var mediaType = details.thumbnail.type ? details.thumbnail.type : 'image/jpg'
          res.contentType(mediaType)
          res.send(data)
        } else {
          res.send({ error: 'File does not exist' })
        }
      }
    }
  })
})

router.get('/:id/metas', function (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) { res.send(err) } else { res.json(media.meta) }
  })
})

router.get('/:id/details/:field', function (req, res) {
  Media.findById(req.params.id, (err, media) => {
    if (err) { res.send(err) } else { res.json(media[req.params.field]) }
  })
})

// ----- POST ----- //
router.post('/', function (req, res) {
  var media = req.body.media
  var filename = req.body.filename

  if (media === undefined) { res.send('Error: media field undefined') }
  if (filename === undefined) { res.send('Error: filename field undefined') }

  var newFile = path.join(config.uploads, filename)

  if (mh.isBase64(media) === true) {
    fs.writeFileSync(newFile, media, 'base64')
    Utils.createMedia({
      file: newFile,
      meta: req.body.meta,
      bucketId: req.body.bucketId
    }).then(media => res.send(media))
  } else {
    mh.toBase64(media).then(data => {
      fs.writeFileSync(newFile, data, 'base64')
      Utils.createMedia({
        file: newFile,
        meta: req.body.meta,
        bucketId: req.body.bucketId
      }).then(media => res.send(media))
    })
    .catch(error => res.send(error))
  }
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
          if (err) { res.send(err) } else { console.log('Updated media', media._id) }
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
    .catch(error => console.log(error))
  }
})

// ----- SPACEBRO EVENTS COMING FROM CHOKIBRO ----- //
Utils.spacebroClient.on('new-media', function (data) {
  Utils.createMedia({
    file: data.path,
    meta: data.meta,
    mediaDetails: data.mediaDetails
  })
  .catch(error => console.log(error))
})

Utils.spacebroClient.on('unlink-media', function (data) {
  var filename = path.basename(data.path)
  Media.findOne({filename: filename}, (err, media) => {
    if (err) { console.log(err) } else {
      Utils.deleteMedia(media._id)
      .catch(error => console.log(error))
    }
  })
})

module.exports = router
