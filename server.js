'use strict'

const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const program = require('commander')
const nconf = require('nconf')

// Reading command line options
program
.option('-s, --settings <file>', 'Use a specific settings file')
.option('-c, --clean', 'Deletes a media when it cannot be found')
.parse(process.argv)

if (program.settings) {
  nconf.file({ file: program.settings })
} else {
  nconf.file({ file: 'settings/settings.default.json' })
}

const config = nconf.get()
const Utils = require('./helpers/utils')
const mediaRouter = require('./controllers/media')
const bucketRouter = require('./controllers/bucket')
const paginationRouter = require('./controllers/pagination')

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
  if (program.clean) {
    Utils.checkIntegrity()
  }
})
