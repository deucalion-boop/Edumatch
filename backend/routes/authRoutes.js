const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  login,
  syncPresence,
  validateInvite,
  completeInvite,
  requestPasswordReset,
  validatePasswordReset,
  completePasswordReset,
} = require('../controllers/authController');
const { changePassword } = require('../controllers/passwordController');

const router = express.Router();

router.post('/login', login);
router.post('/presence', authMiddleware, syncPresence);
router.post('/change-password', authMiddleware, changePassword);
router.get('/invite/:token', validateInvite);
router.post('/invite/:token/complete', completeInvite);
router.post('/forgot-password', requestPasswordReset);
router.get('/reset/:token', validatePasswordReset);
router.post('/reset/:token/complete', completePasswordReset);

module.exports = router;
