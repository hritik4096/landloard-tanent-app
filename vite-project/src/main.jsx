import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import { ChatProvider } from './context/ChatContext';

// Initialize app with proper context hierarchy
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* AuthProvider must be before other providers since they may depend on it */}
      <AuthProvider>
        <MaintenanceProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </MaintenanceProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);