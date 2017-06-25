'use strict'

const express = require('express')
const controller = require('../controllers/bucket')
const router = express.Router()

// --- GET --- //
router.get('/', controller.getAllBuckets)
router.get('/count', controller.getBucketCount)
router.get('/first', controller.getFirstBucket)
router.get('/last', controller.getLastBucket)
router.get('/:id', controller.getBucket)

// --- POST --- //
router.post('/', controller.postBucket)

// --- DELETE --- //
router.delete('/', controller.deleteBucket)

module.exports = router
