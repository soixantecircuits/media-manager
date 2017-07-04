'use strict'

const settings = require('standard-settings').getSettings()
const mediaManager = require('.')
mediaManager.init(settings, (err, infos) => {
  if (err) {
    console.error(err)
  } else {
    console.log(infos)
  }
})
