'use strict'
const spaceBro = require('spacebro-client')
const config = require('standard-settings').getSettings().service.spacebro

spaceBro.connect(config.host, config.port, {
  clientName: config.client,
  channelName: config.channel,
  verbose: false,
  sendBack: false
})
console.log('Connecting to spacebro on ' + config.host + ':' + config.port)

spaceBro.on(config.outputMessage, function (data) {
  console.log('video is ready: ' + data.output)
})

const data = {
  path: './test/assets/pacman.mov',
  details: {
    thumbnail: {
      path: './test/assets/logo.png'
    }
  }
}

setTimeout(function () {
  spaceBro.emit(config.inputMessage, data)
  console.log('emit ')
}, 300)
