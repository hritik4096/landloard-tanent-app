const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const auth = require('../middleware/auth');

// Get all maintenance requests
router.get('/', auth, async (req, res) => {
  try {
    const maintenance = await Maintenance.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create maintenance request
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const maintenance = new Maintenance({
      title,
      description,
      priority,
      createdBy: req.user.userId
    });
    await maintenance.save();
    res.status(201).json(maintenance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update maintenance request
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo } = req.body;
    const maintenance = await Maintenance.findById(req.params.id);
    
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    maintenance.title = title || maintenance.title;
    maintenance.description = description || maintenance.description;
    maintenance.status = status || maintenance.status;
    maintenance.priority = priority || maintenance.priority;
    maintenance.assignedTo = assignedTo || maintenance.assignedTo;
    maintenance.updatedAt = Date.now();

    await maintenance.save();
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete maintenance request - FIXED
router.delete('/:id', auth, async (req, res) => {
  try {
    // Use deleteOne instead of remove()
    const result = await Maintenance.deleteOne({ _id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Maintenance request not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Maintenance request deleted' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;