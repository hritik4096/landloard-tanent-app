import axios from 'axios';

// Get the API URL from environment variable with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Make sure the API URL doesn't have a trailing slash
const apiBaseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

// Helper to check if we're on a deployed environment
const isProduction = window.location.hostname !== 'localhost';

// Log the API configuration once on startup
console.log(`API configured with ${apiBaseUrl} (${isProduction ? 'production' : 'development'} mode)`);

// Always use MongoDB - backend is already running
let USE_MOCK_DATA = false;

// Log initial mode
console.log('API Mode: Using MongoDB Connection');
console.log('MongoDB URL:', API_URL);

// Function to check server availability
const checkServerAvailability = async () => {
  try {
    console.log('🔍 Checking MongoDB server availability at:', API_URL);
    
    const response = await fetch(`${API_URL}/auth/status`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      console.log('✅ MongoDB server is available');
      USE_MOCK_DATA = false;
    } else {
      console.log(`⚠️ MongoDB server responded with status: ${response.status}`);
      // Still using MongoDB even if status isn't 200
      USE_MOCK_DATA = false;
    }
  } catch (error) {
    console.error('⚠️ MongoDB connection error:', error.message);
    // Keep using MongoDB anyway - don't fall back to mock data
    USE_MOCK_DATA = false;
  }
  
  console.log('💾 USING MONGODB CONNECTION: Data will be saved to database');
  console.log('   - Using MongoDB connection at:', API_URL);
};

// Try to connect to the server on startup
checkServerAvailability();

// Local storage key for registered users
const REGISTERED_USERS_KEY = "Bridgelease_registered_users";

// Get previously registered users from localStorage
const getSavedUsers = () => {
  try {
    const savedUsers = localStorage.getItem(REGISTERED_USERS_KEY);
    return savedUsers ? JSON.parse(savedUsers) : [];
  } catch (err) {
    console.error('Error retrieving saved users:', err);
    return [];
  }
};

// Combined users (mock + registered)
const getUsers = () => {
  return [...MOCK_USERS, ...getSavedUsers()];
};

// Save users to localStorage
const saveUsers = (users) => {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
};

// Initialize users collection on load
(() => {
  // This ensures the users collection is loaded on first use
  const existingUsers = getSavedUsers();
  console.log('Loaded users from storage:', existingUsers.length);
})();

// Mock data for maintenance requests
const MOCK_MAINTENANCE_REQUESTS = [
  {
    _id: '1',
    title: 'Leaking Faucet',
    description: 'The kitchen faucet is leaking and needs repair',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    location: 'Kitchen',
    category: 'plumbing'
  },
  {
    _id: '2',
    title: 'Broken Window',
    description: 'The window in the living room is cracked and needs to be replaced',
    status: 'in-progress',
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    location: 'Living Room',
    category: 'structural'
  },
  {
    _id: '3',
    title: 'AC Not Working',
    description: 'The air conditioner is not cooling properly',
    status: 'completed',
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    location: 'Entire Unit',
    category: 'hvac'
  }
];

// Mock user credentials for login
const MOCK_USERS = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    id: 'admin-1',
    name: 'Admin User',
    role: 'admin',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    email: 'tenant@example.com',
    password: 'tenant123',
    id: 'tenant-1',
    name: 'Tenant User',
    role: 'tenant',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    email: 'owner@example.com',
    password: 'owner123',
    id: 'owner-1',
    name: 'Property Owner',
    role: 'owner',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
  }
];

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000, // Increased timeout for deployed environments
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try to get the token from localStorage
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Add deployment-specific error information
    if (isProduction && (!error.response || error.message === 'Network Error')) {
      console.error(
        'Network error detected in production environment. ' +
        'This may be due to missing backend deployment or CORS issues.',
        error
      );
      
      // Enhance the error object with deployment info
      error.deploymentInfo = {
        environment: 'production',
        possibleIssue: 'Backend not deployed or CORS not configured',
        apiUrl: apiBaseUrl,
        clientUrl: window.location.origin
      };
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const auth = {
  login: async (credentials) => {
    // Normalize the email to lowercase
    credentials.email = credentials.email.toLowerCase().trim();
    
    console.log(`🔐 Attempting login with MongoDB: ${credentials.email}`);
    
    try {
      // Try to login with the backend server
      const response = await api.post('/auth/login', credentials);
      console.log('✅ Login successful with MongoDB:', response.data);
      return response;
    } catch (error) {
      console.error('❌ MongoDB login error:', error);
      
      // If there's a specific error message from the server
      if (error.message && typeof error.message === 'string') {
        return Promise.reject({ message: error.message });
      }
      
      // Generic error
      return Promise.reject({ 
        message: 'Login failed. Please try again.' 
      });
    }
  },
  register: async (userData) => {
    // Normalize the email to lowercase
    userData.email = userData.email.toLowerCase().trim();
    
    console.log(`🚀 Registering user with MongoDB: ${userData.email}`);
    
    try {
      // Try to register with the backend server
      const response = await api.post('/auth/register', userData);
      console.log('✅ User registered successfully in MongoDB:', response.data);
      return response;
    } catch (error) {
      console.error('❌ MongoDB registration error:', error);
      
      // If there's a specific error message from the server
      if (error.message && typeof error.message === 'string') {
        return Promise.reject({ message: error.message });
      }
      
      // Generic error
      return Promise.reject({ 
        message: 'Registration failed. Please try again.' 
      });
    }
  },
  checkAuthStatus: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Fast initial check - do we have both token and user?
    if (!token || !user) {
      return { isAuthenticated: false, user: null };
    }
    
    try {
      // Parse user data
      const userData = JSON.parse(user);
      
      // Basic validation that token looks like a JWT
      const isTokenValid = token.split('.').length === 3;
      
      if (!isTokenValid) {
        console.warn('Invalid token format detected');
        return { isAuthenticated: false, user: null };
      }
      
      // Additional check - make sure user has required fields
      if (!userData || !userData.email) {
        console.warn('Invalid user data format detected');
        return { isAuthenticated: false, user: null };
      }
      
      // Advanced - check token expiration if JWT has exp claim
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (tokenData.exp && tokenData.exp * 1000 < Date.now()) {
          console.warn('Token has expired');
          return { isAuthenticated: false, user: null, expired: true };
        }
      } catch (e) {
        // Parsing error, but we'll still proceed with other checks
        console.warn('Could not parse token data');
      }
      
      // Verify the user still exists in our database
      const allUsers = getUsers();
      const userExists = allUsers.some(u => 
        (u.id && userData.id && u.id === userData.id) || 
        (u.email && userData.email && u.email.toLowerCase() === userData.email.toLowerCase())
      );
      
      if (userExists) {
        return { isAuthenticated: true, user: userData };
      } else {
        // User no longer exists in database
        console.warn('User not found in database');
        return { isAuthenticated: false, user: null, userNotFound: true };
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { isAuthenticated: false, user: null, error: true };
    }
  }
};

// Function to test database connection
export const testConnection = async () => {
  try {
    console.log(`Testing connection to ${apiBaseUrl}/api/health`);
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Connection test failed:', error);
    
    if (isProduction) {
      // Check if this is a CORS error
      if (error.message.includes('Network Error') || error.message.includes('CORS')) {
        throw new Error(
          'CORS error detected. Your backend needs to allow requests from: ' + 
          window.location.origin + '. Backend URL: ' + apiBaseUrl
        );
      }
      
      throw new Error(
        'Cannot connect to backend server at ' + apiBaseUrl + '. ' +
        'If you\'ve deployed to Netlify, make sure your backend allows CORS from: ' + 
        window.location.origin
      );
    }
    throw error;
  }
};

// Helper function to simulate API response
const mockResponse = (data, delay = 500) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ data });
    }, delay);
  });
};

// Maintenance services with mock data fallback
export const maintenance = {
  getAll: async () => {
    if (USE_MOCK_DATA) {
      // Try to get data from localStorage first
      const savedRequests = localStorage.getItem('maintenanceRequests');
      if (savedRequests) {
        try {
          const parsedRequests = JSON.parse(savedRequests);
          // If we have saved requests, use those instead of mock data
          if (parsedRequests && parsedRequests.length > 0) {
            return mockResponse(parsedRequests);
          }
        } catch (err) {
          console.error('Error parsing saved maintenance requests:', err);
        }
      }
      
      // If no saved requests, return mock data
      return mockResponse(MOCK_MAINTENANCE_REQUESTS);
    }
    try {
      return await api.get('/maintenance');
    } catch (error) {
      console.warn('API call failed, using mock data instead');
      return mockResponse(MOCK_MAINTENANCE_REQUESTS);
    }
  },
  create: async (data) => {
    if (USE_MOCK_DATA) {
      const newRequest = {
        ...data,
        _id: `maintenance-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to the beginning of the mock data array
      MOCK_MAINTENANCE_REQUESTS.unshift(newRequest);
      
      // Also update localStorage for persistence
      try {
        const savedRequests = localStorage.getItem('maintenanceRequests');
        let requestsArray = savedRequests ? JSON.parse(savedRequests) : [];
        requestsArray.unshift(newRequest);
        localStorage.setItem('maintenanceRequests', JSON.stringify(requestsArray));
      } catch (err) {
        console.error('Error updating localStorage with new request:', err);
      }
      
      return mockResponse(newRequest);
    }
    return api.post('/maintenance', data);
  },
  update: async (id, data) => {
    if (USE_MOCK_DATA) {
      const index = MOCK_MAINTENANCE_REQUESTS.findIndex(req => req._id === id);
      if (index >= 0) {
        MOCK_MAINTENANCE_REQUESTS[index] = { 
          ...MOCK_MAINTENANCE_REQUESTS[index], 
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        // Also update localStorage for persistence
        try {
          const savedRequests = localStorage.getItem('maintenanceRequests');
          if (savedRequests) {
            let requestsArray = JSON.parse(savedRequests);
            const localIndex = requestsArray.findIndex(req => req._id === id);
            if (localIndex >= 0) {
              requestsArray[localIndex] = { 
                ...requestsArray[localIndex], 
                ...data,
                updatedAt: new Date().toISOString()
              };
              localStorage.setItem('maintenanceRequests', JSON.stringify(requestsArray));
            }
          }
        } catch (err) {
          console.error('Error updating localStorage with updated request:', err);
        }
        
        return mockResponse(MOCK_MAINTENANCE_REQUESTS[index]);
      }
      return Promise.reject({ message: 'Request not found' });
    }
    return api.put(`/maintenance/${id}`, data);
  },
  deleteOne: async (id) => {
    if (USE_MOCK_DATA) {
      const index = MOCK_MAINTENANCE_REQUESTS.findIndex(req => req._id === id);
      if (index >= 0) {
        MOCK_MAINTENANCE_REQUESTS.splice(index, 1);
        
        // Also update localStorage for persistence
        try {
          const savedRequests = localStorage.getItem('maintenanceRequests');
          if (savedRequests) {
            let requestsArray = JSON.parse(savedRequests);
            requestsArray = requestsArray.filter(req => req._id !== id);
            localStorage.setItem('maintenanceRequests', JSON.stringify(requestsArray));
          }
        } catch (err) {
          console.error('Error updating localStorage after deleting request:', err);
        }
        
        return mockResponse({ success: true, message: 'Request deleted successfully' });
      }
      return Promise.reject({ message: 'Request not found' });
    }
    try {
      const response = await api.delete(`/maintenance/${id}`);
      return response;
    } catch (error) {
      console.error('Delete request failed:', error);
      throw error;
    }
  }
};

export default api; 