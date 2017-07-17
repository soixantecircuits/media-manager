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
const bucketController = require('./controllers/bucket')
var packageInfos = require('../package.json')
const stateServe = require('./helpers/state-serve')

let init = (settings, cb) => {
  const app = express()
  // Mongoose
  const server = settings.server
  const port = server.port
  var mongodbURL = 'mongodb://localhost/media-manager'
  if (settings.service.mongodb && settings.service.mongodb.url) {
    mongodbURL = settings.service.mongodb.url
  }
  Utils.init(settings) // Init spacebro before events are added
  mediaController.init(settings)
  bucketController.init()
  mongoose.Promise = global.Promise
  mongoose.connect(mongodbURL, {server: {auto_reconnect: true}}, (err) => {
    if (err) {
      winston.error('An error occured at first connection attempt to the mongo DB.')
      winston.error(err)
    } else {
      winston.info(`Connection to ${mongodbURL} succeed, opening...`)
    }
  })

  const db = mongoose.connection
  db.on('error', (err) => {
    winston.error(`Connection error with ${mongodbURL}`)
    winston.error(err)
  })
  db.on('connecting', function() {
    winston.info(`Connecting to ${mongodbURL}...`)
  })
  db.on('connected', function() {
    winston.info(`Connected to ${mongodbURL}.`)
  })
  db.on('reconnected', function () {
    winston.info('MongoDB reconnected!');
  })
  db.on('disconnected', function() {
    winston.error('MongoDB disconnected!')
    mongoose.connect(mongodbURL, {server: {auto_reconnect: true}})
  })
  db.once('open', function () {
    winston.info(`Connection to ${mongodbURL} opened.`)
    // App
    app.use(cors())
    app.use('/static', express.static(settings.folder.data))

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use('/api/v1/medias', mediaRouter)
    app.use('/api/v1/medias', paginationRouter)
    app.use('/api/v1/buckets', bucketRouter)

    app.get('/index.json', function (req, res) {
      res.json({ service: 'media-manager', status: 'running', settings: settings })
    })
    
    stateServe.init(app, {
      app: {
        name: packageInfos.name,
        version: packageInfos.version,
        site: {
          url: packageInfos.repository.url,
          name: packageInfos.name
        }
      }
    })

    app.listen(port, function (err) {
      if (!err) {
        cb && cb(null, {port: port})
      } else {
        winston.info(`Running on: http://${server.host}:${port}`)
        fs.ensureDirSync(settings.folder.data)
        if (settings.clean === true) {
          Utils.checkIntegrity()
        }
        cb && cb(err)
      }
    })
    return app
  })
}

module.exports = {
  init
}
