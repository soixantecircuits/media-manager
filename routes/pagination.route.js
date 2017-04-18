'use strict'

const express = require('express')
const controller = require('../controllers/pagination')
const router = express.Router()

// --- GET --- //
router.get('/', controller.getAllMedia)
router.get('/:id', controller.getMediaData)

module.exports = router
