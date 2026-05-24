'use strict';
const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/projects.controller');
const mc = require('../controllers/projectMembers.controller');

const router = Router();
router.use(authenticate);

router.get('/', c.list);
router.get('/stats', c.stats);
router.post('/', c.create);
router.get('/:id', c.getById);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

// Member management
router.get('/:id/members', mc.list);
router.post('/:id/members', mc.invite);
router.put('/:id/members/:memberId', mc.update);
router.delete('/:id/members/:memberId', mc.remove);

module.exports = router;
