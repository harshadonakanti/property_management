const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', authorize(['Super Administrator', 'Property Manager', 'Account Manager']), propertyController.getProperties);
router.get('/:id', authorize(['Super Administrator', 'Property Manager', 'Account Manager']), propertyController.getPropertyById);

router.post('/', authorize(['Super Administrator', 'Property Manager']), propertyController.createProperty);
router.put('/:id', authorize(['Super Administrator', 'Property Manager']), propertyController.updateProperty);
router.delete('/:id', authorize(['Super Administrator', 'Property Manager']), propertyController.deleteProperty);

module.exports = router;
