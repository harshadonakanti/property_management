const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const bookingController = require('../controllers/booking.controller');

router.get('/amenities', publicController.getPublicAmenities);
router.post('/bookings', bookingController.createPublicBooking);

module.exports = router;
