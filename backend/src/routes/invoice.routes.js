const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', authorize(['Super Administrator', 'Account Manager']), invoiceController.getInvoices);
router.get('/:id', authorize(['Super Administrator', 'Account Manager']), invoiceController.getInvoiceById);
router.put('/:id/payment', authorize(['Super Administrator', 'Account Manager']), invoiceController.updatePaymentStatus);
router.get('/:id/pdf', authorize(['Super Administrator', 'Account Manager']), invoiceController.exportInvoicePdf);

module.exports = router;
