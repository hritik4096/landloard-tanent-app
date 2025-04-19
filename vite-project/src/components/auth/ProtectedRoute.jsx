import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  useEffect(() => {
    // Fast initial check - if we're already authenticated, don't show loading
    if (isAuthenticated) {
      setIsCheckingAuth(false);
      return;
    }
    
    // Secondary check for cached auth in localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      // No cached auth, we can stop checking
      setIsCheckingAuth(false);
      return;
    }
    
    // We have token and user but isAuthenticated is false - wait briefly
    // This handles the race condition during page reloads
    const authCheckTimeout = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 300);
    
    return () => clearTimeout(authCheckTimeout);
  }, [isAuthenticated]);
  
  // If both the application loading state and our check are complete, proceed
  if (!loading && !isCheckingAuth) {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      // Check once more directly from localStorage before redirecting
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        // We still have credentials, but AuthContext thinks we're not authenticated
        // This happens during page reloads - show loading instead of redirecting
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Restoring your session...</p>
            </div>
          </div>
        );
      }
      
      // Save the attempted URL for redirecting after login
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // User is authenticated, render the protected content
    return children;
  }
  
  // Show loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
      </div>
    </div>
  );
};

export default ProtectedRoute; 