'use strict';
const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/auth.controller');

const router = Router();

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/refresh', c.refresh);
router.post('/logout', c.logout);
router.get('/me', authenticate, c.me);

module.exports = router;
