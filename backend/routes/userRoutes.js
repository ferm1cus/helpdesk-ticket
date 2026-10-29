const router = require('express').Router();
const c = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateNewUser } = require('../middleware/validate');

router.use(authenticate);
router.get('/agents', authorize('agent', 'admin'), c.agents);
router.get('/', authorize('admin'), c.list);
router.post('/', authorize('admin'), validateNewUser, c.create);
module.exports = router;
