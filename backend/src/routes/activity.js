'use strict';
const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/activity.controller');

const router = Router();
router.use(authenticate);

router.get('/', c.list);

module.exports = router;
