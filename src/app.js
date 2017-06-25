'use strict'

const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const fs = require('fs-extra')
const winston = require('winston')

const Utils = require('./helpers/utils')
const mediaRouter = require('./routes/media.route.js')
const bucketRouter = require('./routes/bucket.route.js')
const paginationRouter = require('./routes/pagination.route.js')
const mediaController = require('./controllers/media.js')

let init = (settings) => {
  const app = express()
  // Mongoose
  const server = settings.server
  const port = server.port
  mediaController.init(settings)

  mongoose.Promise = global.Promise
  mongoose.connect('mongodb://localhost/media-manager')

  const db = mongoose.connection
  db.on('error', console.error.bind(console, 'connection error:'))
  db.once('open', function () {
    winston.info('connection to database established')
  })

  // App
  app.use(cors())
  app.use('/static', express.static(settings.folder.data))

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use('/api/v1/medias', mediaRouter)
  app.use('/api/v1/medias', paginationRouter)
  app.use('/api/v1/buckets', bucketRouter)

  app.get('/', function (req, res) {
    res.json({ service: 'media-manager', status: 'running', settings: settings })
  })

  app.listen(port, function () {
    winston.info(`Running on: http://${server.host}:${port}`)
    fs.ensureDirSync(settings.folder.data)
    if (settings.clean === true) {
      Utils.checkIntegrity()
    }
  })
  return app
}

module.exports = {
  init
}
