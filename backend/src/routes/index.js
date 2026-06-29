const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const propertyRoutes = require('./property.routes');
const amenityRoutes = require('./amenity.routes');
const bookingRoutes = require('./booking.routes');
const invoiceRoutes = require('./invoice.routes');
const dashboardRoutes = require('./dashboard.routes');
const auditRoutes = require('./audit.routes');
const publicRoutes = require('./public.routes');
const employeeRoutes = require('./employee.routes');

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/amenities', amenityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/audit', auditRoutes);
router.use('/public', publicRoutes);
router.use('/employees', employeeRoutes);

module.exports = router;
