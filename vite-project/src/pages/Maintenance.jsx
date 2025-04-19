import React, { useState, useEffect, useCallback } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import Header from '../components/dashboard/Header';
import { useAuth } from '../context/AuthContext';
import { Wrench, Clock, CheckCircle, X, AlertTriangle, RefreshCw, List, Grid } from 'lucide-react';

const Maintenance = () => {
  const { requests, loading, error, fetchRequests, updateRequest, deleteRequest, createRequest } = useMaintenance();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'low',
    location: '',
    category: 'general',
    status: 'pending'
  });
  
  const [localError, setLocalError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState(localStorage.getItem('maintenanceViewMode') || 'list');

  // Initial data fetch only if we don't have requests yet
  useEffect(() => {
    if (requests.length === 0) {
      fetchRequests().catch(err => {
        console.error("Failed to fetch requests:", err);
      });
    }
  }, [fetchRequests, requests.length]);

  // Function to manually refresh data
  const refreshData = useCallback(async () => {
    try {
      setRefreshing(true);
      setLocalError(null);
      await fetchRequests();
      setSuccessMessage('Maintenance requests refreshed');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to refresh requests:", err);
      setLocalError(err.message || 'Error refreshing data');
    } finally {
      setRefreshing(false);
    }
  }, [fetchRequests]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      setLocalError(null);
      
      // Add current user info to request
      const enhancedFormData = {
        ...formData,
        createdBy: user?.name || 'Current User',
        userId: user?.id || 'user-1'
      };
      
      // Create the new request using the context function
      await createRequest(enhancedFormData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'low',
        location: '',
        category: 'general',
        status: 'pending'
      });
      
      setShowForm(false);
      setSuccessMessage('Maintenance request created successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error creating maintenance request:', err);
      setLocalError(err.message || 'Error creating request. Please try again.');
    }
  }, [formData, createRequest, user]);

  const handleStatusUpdate = useCallback(async (id, newStatus) => {
    try {
      setLocalError(null);
      
      // Use the context function to update the request
      await updateRequest({ _id: id, status: newStatus });
      
      setSuccessMessage(`Request status updated to ${newStatus}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating request status:', err);
      setLocalError(err.message || 'Error updating status. Please try again.');
    }
  }, [updateRequest]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        setLocalError(null);
        setIsDeleting(true);
        setDeletingId(id);
        
        await deleteRequest(id);
        
        // If we get here, the delete was successful
        setIsDeleting(false);
        setDeletingId(null);
        
        setSuccessMessage('Request deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (err) {
        console.error('Error deleting request:', err);
        setLocalError(err.message || 'Failed to delete request. Please try again.');
        setIsDeleting(false);
        setDeletingId(null);
      }
    }
  }, [deleteRequest]);
  
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleRetry = () => {
    setLocalError(null);
    fetchRequests().catch(err => {
      console.error("Failed to fetch requests on retry:", err);
    });
  };

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="mr-1" size={12} />
            Pending
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Wrench className="mr-1" size={12} />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1" size={12} />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get summary counts for the dashboard
  const pendingCount = requests.filter(req => req.status === 'pending').length;
  const inProgressCount = requests.filter(req => req.status === 'in-progress').length;
  const completedCount = requests.filter(req => req.status === 'completed').length;

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Maintenance Requests</h1>
            <p className="text-gray-600 text-sm">Manage and track your maintenance tickets</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                setShowForm(!showForm);
                setLocalError(null);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showForm ? (
                <>
                  <X size={16} className="mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Wrench size={16} className="mr-2" />
                  New Request
                </>
              )}
            </button>
            
            <button 
              onClick={refreshData}
              disabled={refreshing}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {refreshing ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </>
              )}
            </button>
            
            <div className="flex items-center border rounded-md overflow-hidden">
              <button
                onClick={() => {
                  setViewMode('list');
                  localStorage.setItem('maintenanceViewMode', 'list');
                }}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-500'}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => {
                  setViewMode('grid');
                  localStorage.setItem('maintenanceViewMode', 'grid');
                }}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-500'}`}
              >
                <Grid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Summary */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <h3 className="text-2xl font-bold text-gray-800">{pendingCount}</h3>
              </div>
              <Clock className="text-yellow-400" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-400">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <h3 className="text-2xl font-bold text-gray-800">{inProgressCount}</h3>
              </div>
              <Wrench className="text-blue-400" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-400">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <h3 className="text-2xl font-bold text-gray-800">{completedCount}</h3>
              </div>
              <CheckCircle className="text-green-400" size={24} />
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 animate-fadeIn" role="alert">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="block sm:inline">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {(error || localError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="block sm:inline">{error || localError}</span>
              </div>
              <button 
                onClick={handleRetry} 
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4">Submit a New Maintenance Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Issue Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                  placeholder="Brief title of the issue"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                  placeholder="e.g. Kitchen, Bathroom, Living Room"
                />
              </div>

              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC</option>
                    <option value="appliance">Appliance</option>
                    <option value="structural">Structural</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                  placeholder="Please describe the issue in detail"
                  rows="4"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading state */}
        {loading && !refreshing && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Request Display Area */}
        {!loading && requests.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <div className="mb-4 text-gray-400 flex justify-center">
              <Wrench size={64} />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Maintenance Requests</h3>
            <p className="text-gray-500 mb-6">You haven't submitted any maintenance requests yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
            >
              Create Your First Request
            </button>
          </div>
        ) : (
          <div className={viewMode === 'list' ? '' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
            {viewMode === 'list' ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 bg-gray-50 text-gray-500 text-sm font-medium border-b">
                  <div className="col-span-3 px-4 py-3">Issue</div>
                  <div className="col-span-2 px-4 py-3">Category</div>
                  <div className="col-span-2 px-4 py-3">Date</div>
                  <div className="col-span-2 px-4 py-3">Status</div>
                  <div className="col-span-3 px-4 py-3 text-right">Actions</div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {requests.map((request) => (
                    <div key={request._id || request.id} className="grid grid-cols-1 sm:grid-cols-12 hover:bg-gray-50">
                      <div className="col-span-1 sm:col-span-3 px-4 py-4 font-medium text-gray-900 sm:border-r flex flex-col">
                        <div className="text-sm sm:text-base font-medium">{request.title}</div>
                        <div className="text-xs text-gray-500 mt-1 sm:hidden block">{request.category} • {formatDate(request.createdAt || request.date)}</div>
                        <div className="sm:hidden block mt-2">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      <div className="hidden sm:block col-span-2 px-4 py-4 text-gray-600 border-r capitalize">
                        {request.category}
                      </div>
                      <div className="hidden sm:block col-span-2 px-4 py-4 text-gray-600 border-r">
                        {formatDate(request.createdAt || request.date)}
                      </div>
                      <div className="hidden sm:flex col-span-2 px-4 py-4 items-center border-r">
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="col-span-1 sm:col-span-3 px-4 py-4 text-right space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row sm:items-center sm:justify-end">
                        {isAdmin && (
                          <div className="flex justify-end">
                            <select
                              onChange={(e) => handleStatusUpdate(request._id || request.id, e.target.value)}
                              className="border border-gray-300 text-sm rounded-md px-2 py-1 mr-2"
                              defaultValue={request.status}
                            >
                              <option value="pending">Pending</option>
                              <option value="in progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(request._id || request.id)}
                          disabled={isDeleting && deletingId === (request._id || request.id)}
                          className={`text-red-600 hover:text-red-800 text-sm py-1 px-2 rounded border border-gray-200 hover:border-red-200 ${isDeleting && deletingId === (request._id || request.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isDeleting && deletingId === (request._id || request.id) ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Grid view for requests
              requests.map((request) => (
                <div key={request._id || request.id} className="bg-white rounded-lg shadow overflow-hidden mb-4 sm:mb-0 hover:shadow-md transition-shadow">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{request.title}</h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                      <p className="line-clamp-3">{request.description}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center capitalize">
                        <span className="mr-1">•</span> {request.category}
                      </span>
                      <span className="inline-flex items-center">
                        <span className="mr-1">•</span> {formatDate(request.createdAt || request.date)}
                      </span>
                      {request.location && (
                        <span className="inline-flex items-center">
                          <span className="mr-1">•</span> {request.location}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      {isAdmin && (
                        <select
                          onChange={(e) => handleStatusUpdate(request._id || request.id, e.target.value)}
                          className="border border-gray-300 text-sm rounded-md mr-2 px-2 py-1"
                          defaultValue={request.status}
                        >
                          <option value="pending">Pending</option>
                          <option value="in progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      )}
                      <button
                        onClick={() => handleDelete(request._id || request.id)}
                        disabled={isDeleting && deletingId === (request._id || request.id)}
                        className={`text-red-600 hover:text-red-800 text-sm py-1 px-2 rounded border border-gray-200 hover:border-red-200 transition-colors ${isAdmin ? '' : 'ml-auto'} ${isDeleting && deletingId === (request._id || request.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isDeleting && deletingId === (request._id || request.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Maintenance;