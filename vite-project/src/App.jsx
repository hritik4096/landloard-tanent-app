import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Maintenance from './pages/Maintenance';
import Messages from './pages/Messages';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import { useAuth } from './context/AuthContext';
import { testConnection } from './services/api';

// Splash screen component shown during initial load
const SplashScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white">
    <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center shadow-lg animate-pulse mb-6">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 text-white"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    </div>
    <h1 className="text-3xl font-bold text-gray-800 mb-2">Bridgelease</h1>
    <p className="text-gray-600">Loading your experience...</p>
    <div className="mt-8 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-blue-600 animate-loadingBar"></div>
    </div>
  </div>
);

// Create a component to handle the redirect based on auth state
const InitialRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    // Show splash screen for at least 1.5 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      
      // Always redirect to login page for better user experience
      navigate('/login', { replace: true });
    }, 1500);
    
    return () => clearTimeout(splashTimer);
  }, [navigate]);
  
  if (showSplash || loading) {
    return <SplashScreen />;
  }
  
  // This return will rarely be visible as the navigate will happen first
  return null;
};

function App() {
  // Check MongoDB connection on startup
  useEffect(() => {
    const checkMongoDBConnection = async () => {
      try {
        const connectionStatus = await testConnection();
        console.log('MongoDB connection status:', connectionStatus.message);
      } catch (error) {
        console.error('Failed to check MongoDB connection:', error);
      }
    };
    
    checkMongoDBConnection();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Root route redirects based on auth state */}
        <Route path="/" element={<InitialRedirect />} />
        
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="flex flex-col md:flex-row">
              <Sidebar />
              <div className="w-full md:ml-0 lg:ml-64">
                <Dashboard />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/maintenance" element={
          <ProtectedRoute>
            <div className="flex flex-col md:flex-row">
              <Sidebar />
              <div className="w-full md:ml-0 lg:ml-64">
                <Maintenance />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <div className="flex flex-col md:flex-row">
              <Sidebar />
              <div className="w-full md:ml-0 lg:ml-64">
                <Messages />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/schedule" element={
          <ProtectedRoute>
            <div className="flex flex-col md:flex-row">
              <Sidebar />
              <div className="w-full md:ml-0 lg:ml-64">
                <Schedule />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <div className="flex flex-col md:flex-row">
              <Sidebar />
              <div className="w-full md:ml-0 lg:ml-64">
                <Settings />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;