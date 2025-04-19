import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { maintenance } from '../services/api';

// Create the context
const MaintenanceContext = createContext();

// Provider component
export const MaintenanceProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load maintenance requests from local storage on initial load
  useEffect(() => {
    const savedRequests = localStorage.getItem('maintenanceRequests');
    if (savedRequests) {
      try {
        setRequests(JSON.parse(savedRequests));
      } catch (err) {
        console.error('Error parsing saved maintenance requests:', err);
      }
    }
  }, []);

  // Save requests to localStorage whenever they change
  useEffect(() => {
    if (requests.length > 0) {
      localStorage.setItem('maintenanceRequests', JSON.stringify(requests));
    }
  }, [requests]);

  // Fetch all maintenance requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await maintenance.getAll();
      setRequests(response.data);
      // Save to localStorage for persistence
      localStorage.setItem('maintenanceRequests', JSON.stringify(response.data));
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch maintenance requests');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new maintenance request
  const createRequest = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await maintenance.create(data);
      
      // Update local state with the new request
      setRequests(prevRequests => {
        const updatedRequests = [response.data, ...prevRequests];
        // Save to localStorage for persistence
        localStorage.setItem('maintenanceRequests', JSON.stringify(updatedRequests));
        return updatedRequests;
      });
      
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to create maintenance request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing maintenance request
  const updateRequest = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await maintenance.update(data._id, data);
      
      // Update local state with the updated request
      setRequests(prevRequests => {
        const updatedRequests = prevRequests.map(request => 
          request._id === data._id ? { ...request, ...data } : request
        );
        // Save to localStorage for persistence
        localStorage.setItem('maintenanceRequests', JSON.stringify(updatedRequests));
        return updatedRequests;
      });
      
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to update maintenance request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a maintenance request
  const deleteRequest = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await maintenance.deleteOne(id);
      
      // Update local state by removing the deleted request
      setRequests(prevRequests => {
        const updatedRequests = prevRequests.filter(request => request._id !== id);
        // Save to localStorage for persistence
        localStorage.setItem('maintenanceRequests', JSON.stringify(updatedRequests));
        return updatedRequests;
      });
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete maintenance request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear all requests (for testing or logout)
  const clearRequests = useCallback(() => {
    setRequests([]);
    localStorage.removeItem('maintenanceRequests');
  }, []);

  // Context value
  const value = {
    requests,
    loading,
    error,
    fetchRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    clearRequests
  };

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
};

// Custom hook to use the maintenance context
export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};

export default MaintenanceContext;