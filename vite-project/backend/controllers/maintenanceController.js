const Maintenance = require('../models/Maintenance');

// Get all maintenance requests
exports.getAllMaintenanceRequests = async (req, res) => {
  try {
    const requests = await Maintenance.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new maintenance request
exports.createMaintenanceRequest = async (req, res) => {
  try {
    const newRequest = new Maintenance({
      ...req.body,
      createdBy: req.user._id // Assuming user info is added by auth middleware
    });
    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a maintenance request
exports.updateMaintenanceRequest = async (req, res) => {
  try {
    const request = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }
    res.json(request);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a maintenance request
exports.deleteMaintenanceRequest = async (req, res) => {
  try {
    // Use model.deleteOne directly with a filter
    const result = await Maintenance.deleteOne({ _id: req.params.id });
    
    // Check if anything was deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Maintenance request not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Maintenance request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error deleting maintenance request',
      error: error.message 
    });
  }
};