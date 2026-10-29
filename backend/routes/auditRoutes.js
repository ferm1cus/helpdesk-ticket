const router = require('express').Router();
const c = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), c.list);
module.exports = router;
