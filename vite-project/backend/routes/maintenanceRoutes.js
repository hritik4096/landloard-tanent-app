const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Get all maintenance requests
router.get('/', maintenanceController.getAllMaintenanceRequests);

// Create a new maintenance request
router.post('/', maintenanceController.createMaintenanceRequest);

// Update a maintenance request
router.put('/:id', maintenanceController.updateMaintenanceRequest);

// Delete a maintenance request
router.delete('/:id', maintenanceController.deleteMaintenanceRequest);

module.exports = router; 