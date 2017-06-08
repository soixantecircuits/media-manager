'use strict'
const spaceBro = require('spacebro-client')
const settings = require('standard-settings').getSettings()

settings.service.spacebro = settings.service.spacebro || {}
settings.service.spacebro.host = settings.service.spacebro.host || 'spacebro.space'
settings.service.spacebro.port = settings.service.spacebro.port || 3333
settings.service.spacebro.client = settings.service.spacebro.client|| 'media-manager'
settings.service.spacebro.channel = settings.service.spacebro.channel|| 'media-manager'

spaceBro.connect(settings.service.spacebro.host, settings.service.spacebro.port, {
  clientName: settings.service.spacebro.client,
  channelName: settings.service.spacebro.channel,
  verbose: false,
  sendBack: false
})
console.log('Connecting to spacebro on ' + settings.service.spacebro.host + ':' + settings.service.spacebro.port)

settings.service.spacebro.inputMessage = settings.service.spacebro.inputMessage || 'new-media-for-cwmedia-manager'
settings.service.spacebro.outputMessage = settings.service.spacebro.outputMessage || 'new-media-from-media-manager'
spaceBro.on(settings.service.spacebro.outputMessage, function (data) {
  console.log('video is ready: ' + data.output)
})

var data = {
    path: './test/assets/pacman.mov',
    details: {
      thumbnail: {
        path: './test/assets/logo.png'
      }
    }
  }

setTimeout(function () {
  spaceBro.emit(settings.service.spacebro.inputMessage, data)
  console.log('emit ')
}, 300)
