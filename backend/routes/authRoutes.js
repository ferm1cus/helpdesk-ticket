const router = require('express').Router();
const c = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, required } = require('../middleware/validate');

router.post('/register', validateRegister, c.register);
router.post('/login', required('email', 'password'), c.login);
router.get('/me', authenticate, c.me);
module.exports = router;
