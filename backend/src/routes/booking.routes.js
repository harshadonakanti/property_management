const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', authorize(['Super Administrator', 'Property Manager', 'Account Manager']), bookingController.getBookings);
router.get('/:id', authorize(['Super Administrator', 'Property Manager', 'Account Manager']), bookingController.getBookingById);
router.put('/:id/status', authorize(['Super Administrator', 'Property Manager']), bookingController.updateBookingStatus);

module.exports = router;
