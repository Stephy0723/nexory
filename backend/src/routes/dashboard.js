const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/dashboard');

router.use(authenticate);
router.get('/', ctrl.stats);

module.exports = router;
