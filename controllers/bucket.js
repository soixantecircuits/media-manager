'use strict'

const Bucket = require('../models/bucket')
const Media = require('../models/media')
const express = require('express')
const router = express.Router()
const Utils = require('../helpers/utils')

function slugify (text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

Utils.spacebroClient.on('media-updated', function (data) {
  if (data.newBucketId) {
    var errorMsg = 'Error while updating bucket ' + data.newBucketId + ':\n'
    Bucket.findById(data.newBucketId, (err, bucket) => {
      if (err) { return console.log(errorMsg, err) } else {
        Media.findById(data.mediaId, (err, media) => {
          if (err) { return console.log(errorMsg, err) } else {
            bucket.medias.push(media)
            console.log(bucket.medias)
            bucket.save(err => {
              if (err) { return console.log(errorMsg, err) } else {
                console.log('Media', data.mediaId, 'has been added to bucket', data.newBucketId)
              }
            })
          }
        })
      }
    })
  }
})

// ----- POST ----- //
router.post('/', function (req, res) {
  var name = req.body.name
  if (name === undefined) {
    res.send('Error: name field undefined')
  } else {
    var bucket = new Bucket()
    bucket.createdAt = new Date().toISOString()
    bucket.slug = slugify(name)
    bucket.name = name
    bucket.medias = []
    bucket.save(err => {
      if (err) {
        res.send(err)
      } else {
        Utils.spacebroClient.emit('new-bucket', bucket)
        res.send(bucket)
      }
    })
  }
})

// ----- GET ----- //
router.get('/', function (req, res) {
  Bucket.find().exec((err, buckets) => {
    if (err) { res.send(err) } else {
      var len = buckets.length
      res.json({
        data: buckets,
        dataType: 'buckets',
        firstCursor: buckets[0] ? buckets[0]._id : undefined,
        lastCursor: buckets[len - 1] ? buckets[len - 1]._id : undefined,
        count: len
      })
    }
  })
})

router.get('/count', function (req, res) {
  res.contentType('text/plain')
  Bucket.count({}, (err, count) => {
    if (err) { res.send(err) } else { res.send(count.toString()) }
  })
})

router.get('/first', function (req, res) {
  Bucket.findOne().sort({createdAt: 1})
  .exec((err, first) => {
    if (err) { res.send(err) } else { res.json(first) }
  })
})

router.get('/last', function (req, res) {
  Bucket.findOne().sort({createdAt: -1})
  .exec((err, post) => {
    if (err) { res.send(err) } else { res.json(post) }
  })
})

router.get('/:id', function (req, res) {
  Bucket.findById(req.params.id, (err, bucket) => {
    if (err) { res.send(err) } else { res.json(bucket) }
  })
})

// ----- DELETE ----- //
router.delete('/:id', function (req, res) {
  var id = req.params.id
  Bucket.remove({_id: id},
  (err, bucket) => {
    if (err) { res.send(err) } else { res.send('Successfully deleted ' + id + ' bucket') }
  })
})

module.exports = router
