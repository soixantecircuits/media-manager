'use strict'
const { SpacebroClient } = require('spacebro-client')
const settings = require('standard-settings').getSettings()

settings.service.spacebro.client.name += '-test'
const spacebro = new SpacebroClient()

spacebro.on(settings.service.spacebro.client['out'].mediaCreated.eventName, function (data) {
  console.log('video is ready: ' + JSON.stringify(data, null, 2))
})

const data = {
  path: './test/assets/pacman.mov',
  details: {
    thumbnail: {
      path: './test/assets/logo.png'
    }
  }
}

spacebro.on('connect', () => {
  spacebro.emit(settings.service.spacebro.client['in'].mediaCreate.eventName, data)
  console.log('emit ')
})
