const router = require('express').Router();
const c = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateTicket, required } = require('../middleware/validate');

router.use(authenticate);
router.get('/', c.list);
router.post('/', validateTicket, c.create);
router.get('/:id', c.get);
router.patch('/:id/status', required('status'), c.changeStatus);
router.patch('/:id/assign', authorize('agent', 'admin'), c.assign);
router.post('/:id/comments', required('body'), c.addComment);
module.exports = router;
