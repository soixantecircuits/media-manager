'use strict'

const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const express = require('express')
const config = require('./config/config')

const Utils = require('./helpers/utils')
const mediaRouter = require('./controllers/media')
const bucketRouter = require('./controllers/bucket')
const paginationRouter = require('./controllers/pagination')

const app = express()
const port = process.env.PORT || 8080

mongoose.connect('mongodb://localhost/media-manager')
mongoose.Promise = global.Promise

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('Mongoose successfully connected')
})

// CORS middleware
var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
}

app.use('/static', express.static(config.dataFolder))

app.use(allowCrossDomain)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/api/v1/medias', mediaRouter)
app.use('/api/v1/medias', paginationRouter)
app.use('/api/v1/buckets', bucketRouter)

app.listen(port, function () {
  console.log('Listening on port ' + port)
  Utils.checkIntegrity()
})
