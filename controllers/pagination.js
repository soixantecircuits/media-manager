'use strict'

const Media = require('../models/media')
const winston = require('winston')

//router.get('/', function (req, res) {
function getAllMedia (req, res) {
  var state = req.query.state
  var page = Number(req.query.page)
  var perPage = Number(req.query.per_page)
  var query = Media.find().sort({uploadedAt: 1})

  if (state) {
    query.where('state').equals(state)
  }
  if (page && perPage) {
    query.skip(perPage * (page - 1)).limit(perPage)
  }

  query.exec((err, medias) => {
    if (err) {
      winston.error(err)
      res.send(err)
    } else {
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl.split('?').shift()
      var response = {
        data: medias,
        dataType: 'media'
      }
      if (medias.length === perPage) {
        response.nextPage = fullUrl + '?page=' + (page + 1) + '&per_page=' + perPage
      }
      if (page > 1) {
        response.previousPage = fullUrl + '?page=' + (page - 1) + '&per_page=' + perPage
      }
      res.json(response)
    }
  })
}

//router.get('/:id', function (req, res) {
function getMediaData (req, res) {
  var next = req.query.next
  var prev = req.query.prev
  var curId = req.params.id
  var query

  if (next !== undefined) {
    query = Media.find({_id: {$gte: curId}}).sort({_id: 1}).limit(Number(next) + 1)
  } else if (prev !== undefined) {
    query = Media.find({_id: {$lte: curId}}).sort({_id: -1}).limit(Number(prev) + 1)
  } else {
    query = Media.findById(curId)
  }
  query.exec((err, media) => {
    if (err) {
      winston.error(err)
      res.send(err)
    } else if (!media) {
      winston.error('Media not found')
      res.send({ error: 'Media not found', id: curId })
    } else { res.json(media) }
  })
}

module.exports = {
  getAllMedia,
  getMediaData
}
