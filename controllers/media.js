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
    if (err) { res.send(err) } else {
      var data = fs.readFileSync(path.join(media.path, media.filename))
      res.contentType(media.type)
      res.send(data)
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
      if (req.body.state !== undefined) {
        media.state = req.body.state
        media.updatedAt = new Date().toISOString()
        media.save(err => {
          if (err) { res.send(err) } else { console.log('PUT media', media.id, 'new state =', media.state) }
          Utils.spacebroClient.emit('new-state', {mediaId: req.params.id, newState: media.state})
        })
      }
      res.json(media)
    }
  })
})

// ----- DELETE ----- //
router.delete('/:id', function (req, res) {
  var id = req.params.id
  Media.remove({_id: id},
    (err, media) => {
      if (err) { res.send(err) } else { res.send('Successfully deleted ' + id) }
    })
})

module.exports = router
