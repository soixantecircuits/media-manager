'use strict'

const router = require('express').Router()
const Media = require('../models/media')

router.get('/', function (req, res) {
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
    if (err) { res.send(err) } else {
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl.split('?').shift()
      var response = {
        data: medias,
        dataType: 'medias'
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
})

module.exports = router
