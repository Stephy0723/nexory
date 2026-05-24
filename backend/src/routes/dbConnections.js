'use strict';
const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/dbConnections.controller');

const router = Router();
router.use(authenticate);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id/reveal', c.reveal);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
