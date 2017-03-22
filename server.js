'use strict'

const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 8080
const program = require('commander')
const nconf = require('nconf')
const fs = require('fs-extra')
const ip = require('ip')
const winston = require('winston')

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
nconf.set('baseURL', 'http://' + ip.address() + ':' + port + '/')

const config = nconf.get()
const Utils = require('./helpers/utils')
const mediaRouter = require('./routes/media.route.js')
const bucketRouter = require('./routes/bucket.route.js')
const paginationRouter = require('./routes/pagination.route.js')

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/media-manager')

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  winston.info('connection to database established')
})

app.use(cors())
app.use('/static', express.static(config.dataFolder))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/api/v1/medias', mediaRouter)
app.use('/api/v1/medias', paginationRouter)
app.use('/api/v1/buckets', bucketRouter)

app.get('/', function (req, res) {
  res.json({ service: 'media-manager', status: 'running', settings: config })
})

app.listen(port, function () {
  winston.info('address:', ip.address())
  winston.info('port:', port)
  fs.ensureDirSync(config.dataFolder)
  if (program.clean) {
    Utils.checkIntegrity()
  }
})
