const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.get('/', authenticate, authorize(['Super Administrator']), auditController.getAuditLogs);

module.exports = router;
