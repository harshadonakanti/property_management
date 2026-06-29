const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { register, login } = require('../validations/auth.validation');
const authenticate = require('../middleware/auth.middleware');

router.post('/register', register, authController.register);
router.post('/login', login, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
