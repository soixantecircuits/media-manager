'use strict'

const express = require('express')
const controller = require('../controllers/media')
const router = express.Router()

// --- GET --- //
router.get('/settings', controller.getSettings)
router.get('/count', controller.getCount)
router.get('/first', controller.getFirst)
router.get('/last', controller.getLast)
router.get('/:id/export', controller.getMedia)
router.get('/:id/thumbnail', controller.getThumbnail)
router.get('/:id/:field', controller.getField)

// --- POST --- //
router.post('/', controller.postMedia)

// --- PUT --- //
router.put('/:id', controller.updateMedia)

// --- DELETE --- //
router.delete('/:id', controller.deleteMedia)

module.exports = router
