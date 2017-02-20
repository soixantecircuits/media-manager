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

function updateBucket (bucket) {
  return new Promise((resolve, reject) => {
    Media.find({'bucketId': bucket._id})
    .exec((err, medias) => {
      if (err) { reject(err) } else {
        bucket.medias = medias
        bucket.save(err => {
          if (err) { reject(err) } else { Utils.spacebroClient.emit('new-bucket', bucket) }
        })
        resolve(bucket)
      }
    })
  })
}

// ----- POST ----- //
router.post('/', function (req, res) {
  var name = req.body.name

  if (name === undefined) { res.send('Error: name field undefined') }
  var bucket = new Bucket()
  bucket.createdAt = new Date().toISOString()
  bucket.slug = slugify(name)
  bucket.name = name
  updateBucket(bucket)
  .then(result => res.send(result))
  .catch(error => res.send(error))
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

router.get('/update', function (req, res) {
  var updated = 0
  Bucket.find().exec((err, buckets) => {
    if (err) { res.send(err) } else {
      buckets.forEach(bucket => {
        updateBucket(bucket)
        .then(result => {
          updated++
          if (updated === buckets.length) { res.send('Updated ' + updated + ' bucket(s)') }
        })
        .catch(error => res.send(error))
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
