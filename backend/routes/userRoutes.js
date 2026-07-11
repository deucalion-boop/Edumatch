const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { createAndInviteUser } = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('admin'));
router.post('/create-and-invite', createAndInviteUser);

module.exports = router;
