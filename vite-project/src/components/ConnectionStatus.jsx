import React, { useState, useEffect } from 'react';
import { testConnection } from '../services/api';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ConnectionStatus = () => {
  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    mode: 'unknown',
    message: 'Checking connection...'
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(null);

  const checkConnection = async () => {
    try {
      setIsRetrying(true);
      const connectionStatus = await testConnection();
      setStatus({
        loading: false,
        ...connectionStatus
      });
    } catch (error) {
      setStatus({
        loading: false,
        connected: false,
        mode: 'error',
        message: 'Error checking connection: ' + (error.message || 'Unknown error')
      });
      setError(error);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const apiUrl = import.meta.env.VITE_API_URL || 'Not configured';
  const isProduction = window.location.hostname !== 'localhost';
  const netlifyUrl = window.location.origin;

  if (status.loading) {
    return (
      <div className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center">
        <div className="animate-spin h-3 w-3 border-t-2 border-blue-500 rounded-full mr-2"></div>
        Checking database connection...
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg mt-4">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            {isProduction 
              ? "Backend Connection Issue (Vercel Deployment)" 
              : "Can't connect to MongoDB"}
          </h3>
          
          {isProduction ? (
            <>
              <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                There's an issue connecting to your Vercel backend. Please check:
              </p>
              <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-400 list-disc list-inside ml-4 space-y-1">
                <li>Your backend API at <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">{apiUrl}</code> is actually running</li>
                <li>The backend has proper CORS configuration to allow requests from <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">{netlifyUrl}</code></li>
                <li>If using Vercel, check that the API routes are correctly configured with proper endpoints</li>
                <li>Try a different API route like <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">{apiUrl}/api/health</code> to test the connection</li>
              </ul>
              
              <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                <p className="font-semibold">Quick Fix for Vercel Deployment:</p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>Check your Vercel build logs for any deployment errors</li>
                  <li>Add the following CORS configuration to your Vercel backend:
                    <pre className="mt-1 bg-yellow-50 dark:bg-yellow-950 p-2 rounded text-xs overflow-x-auto">
{`// Add this to your API routes
import Cors from 'cors'

const cors = Cors({
  origin: ['${netlifyUrl}', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
})

// Helper to initialize middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

export default async function handler(req, res) {
  // Run the CORS middleware
  await runMiddleware(req, res, cors)
  
  // Your API logic here
}`}
                    </pre>
                  </li>
                  <li>Make sure your Netlify environment variable <code>VITE_API_URL</code> is set to <code>https://tenant-landlord-communication-platform-9ktm.vercel.app</code> (without a trailing slash)</li>
                  <li>Check if API endpoints are working by testing directly in the browser: <code>{apiUrl}/api/health</code></li>
                </ol>
              </div>
              
              <div className="flex justify-end mt-3">
                <button
                  onClick={checkConnection}
                  className="text-xs flex items-center justify-center gap-1 py-1 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-800/20 transition-colors"
                >
                  <RefreshCw size={12} className={isRetrying ? "animate-spin" : ""} />
                  {isRetrying ? 'Checking...' : 'Test Connection Again'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                Please check that:
              </p>
              <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-400 list-disc list-inside ml-4 space-y-1">
                <li>MongoDB server is running</li>
                <li>Backend server is running at {apiUrl}</li>
                <li>The browser can connect to the backend (no network blocks/CORS issues)</li>
              </ul>
              
              <div className="flex justify-end mt-3">
                <button
                  onClick={checkConnection}
                  className="text-xs flex items-center justify-center gap-1 py-1 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-800/20 transition-colors"
                >
                  <RefreshCw size={12} className={isRetrying ? "animate-spin" : ""} />
                  {isRetrying ? 'Checking...' : 'Test Connection Again'}
                </button>
              </div>
            </>
          )}
          
          <div className="mt-3">
            <p className="text-xs text-yellow-600 dark:text-yellow-500">Current configuration:</p>
            <p className="text-xs font-mono mt-1 bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded">
              API URL: {apiUrl}
            </p>
            <p className="text-xs font-mono mt-1 bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded">
              Frontend URL: {netlifyUrl}
            </p>
            {error && (
              <p className="text-xs font-mono mt-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-1.5 rounded">
                Error: {error.toString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus; 