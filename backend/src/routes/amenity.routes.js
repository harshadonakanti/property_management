const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenity.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', authorize(['Super Administrator', 'Property Manager', 'Account Manager']), amenityController.getAmenities);
router.get('/:id', authorize(['Super Administrator', 'Property Manager', 'Account Manager']), amenityController.getAmenityById);

router.post('/', authorize(['Super Administrator', 'Property Manager']), amenityController.createAmenity);
router.put('/:id', authorize(['Super Administrator', 'Property Manager']), amenityController.updateAmenity);
router.delete('/:id', authorize(['Super Administrator', 'Property Manager']), amenityController.deleteAmenity);
router.post('/:id/assign', authorize(['Super Administrator', 'Property Manager']), amenityController.assignAmenityToProperties);

module.exports = router;
