'use strict'

const program = require('commander')
const nconf = require('nconf')
const ip = require('ip')
const winston = require('winston')

program
.option('-s, --settings <file>', 'Use a specific settings file')
.option('-c, --clean', 'Deletes a media when it cannot be found')
.parse(process.argv)

if (program.settings) {
  winston.info('Loaded settings from', program.settings)
  nconf.file({ file: program.settings })
} else {
  winston.info('Loaded settings from settings/settings.default.json')
  nconf.file({ file: './settings/settings.default.json' })
}
nconf.set('app:baseURL', 'http://' + ip.address() + ':' + nconf.get('app:server:port') + '/')
nconf.set('app:settingsFile', program.settings)
nconf.set('app:cleanOption', program.clean === true)

module.exports = nconf.get()
