import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize state directly from localStorage for immediate authentication
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        return null;
      }
    }
    return null;
  });
  
  const [loading, setLoading] = useState(false);

  // Define logout function first to avoid reference issues
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Also clear maintenance requests to avoid persistence issues
    localStorage.removeItem('maintenanceRequests');
  }, []);

  // Function to verify if stored token is valid
  const verifyStoredAuth = useCallback(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!storedToken || !storedUser) {
      return false;
    }
    
    try {
      // Basic JWT structure validation (3 parts separated by dots)
      if (storedToken.split('.').length !== 3) {
        console.warn('Invalid token format in localStorage');
        return false;
      }
      
      // Parse stored user
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser || !parsedUser.email) {
        console.warn('Invalid user data in localStorage');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error verifying stored auth:', err);
      return false;
    }
  }, []);

  // Login function
  const login = useCallback((authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    
    // Save to localStorage for persistence
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setLoading(false);
  }, []);

  // Update user data (e.g. after profile edit)
  const updateUser = useCallback(async (updatedData) => {
    if (!user) return;
    
    try {
      // Save updated user data to localStorage
      const updatedUser = { ...user, ...updatedData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state 
      setUser(updatedUser);
      
      // Log the update for debugging
      console.log('User data updated:', updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }, [user]);

  // Create context value - use memoized value to prevent unnecessary re-renders
  const value = {
    token,
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
