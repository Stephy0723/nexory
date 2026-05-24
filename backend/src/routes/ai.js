'use strict';
const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { chat, apply } = require('../controllers/ai.controller');

const router = Router();

router.use(authenticate);
router.post('/chat', chat);
router.post('/apply', apply);

module.exports = router;
