const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

// Protect all routes under this module, accessible only to Super Administrator
router.use(authenticate, authorize(['Super Administrator']));

router.get('/', employeeController.getEmployees);
router.get('/roles', employeeController.getRoles);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.post('/:id/reset-password', employeeController.resetPassword);
router.post('/:id/revoke', employeeController.revokeAccess);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
