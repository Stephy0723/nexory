'use strict';
const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/notes.controller');

const router = Router();
router.use(authenticate);

router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.patch('/:id/pin', c.pin);
router.delete('/:id', c.remove);

module.exports = router;
