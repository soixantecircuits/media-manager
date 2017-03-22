'use strict'

const Bucket = require('../models/bucket')
const Media = require('../models/media')
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
            bucket.save(err => {
              if (err) { return console.log(errorMsg, err) } else {
                console.log('A media has been added to bucket', data.newBucketId)
              }
            })
          }
        })
      }
    })
  }
})

Utils.spacebroClient.on('media-deleted', function (data) {
  if (data.bucketId) {
    var errorMsg = 'Error while deleting media from bucket ' + data.bucketId + ':\n'
    Bucket.findById(data.bucketId, (err, bucket) => {
      if (err) { return console.log(errorMsg, err) } else {
        bucket.medias.forEach((media, index) => {
          if (media._id.toString() === data.mediaId) {
            bucket.medias.splice(index, 1)
            bucket.save(err => {
              if (err) { return console.log(errorMsg, err) } else {
                console.log('A media has been deleted from bucket', data.bucketId)
              }
            })
          }
        })
      }
    })
  }
})

function postBucket (req, res) {
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
}

function getAllBuckets (req, res) {
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
}

function getBucketCount (req, res) {
  res.contentType('text/plain')
  Bucket.count({}, (err, count) => {
    if (err) { res.send(err) } else { res.send(count.toString()) }
  })
}

function getFirstBucket (req, res) {
  Bucket.findOne().sort({createdAt: 1})
  .exec((err, first) => {
    if (err) { res.send(err) } else { res.json(first) }
  })
}

function getLastBucket (req, res) {
  Bucket.findOne().sort({createdAt: -1})
  .exec((err, post) => {
    if (err) { res.send(err) } else { res.json(post) }
  })
}

function getBucket (req, res) {
  Bucket.findById(req.params.id, (err, bucket) => {
    if (err) { res.send(err) } else { res.json(bucket) }
  })
}

function deleteBucket (req, res) {
  var id = req.params.id
  Bucket.remove({_id: id},
  (err, bucket) => {
    if (err) { res.send(err) } else { res.send('Successfully deleted ' + id + ' bucket') }
  })
}

module.exports = {
  postBucket,
  getAllBuckets,
  getBucketCount,
  getFirstBucket,
  getLastBucket,
  getBucket,
  deleteBucket
}
