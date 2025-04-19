import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { auth } from '../services/api';
import { Eye, EyeOff, Mail, Lock, Info, AlertCircle, User, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConnectionStatus from '../components/ConnectionStatus';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  
  // Get redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  // Demo account credentials
  const demoAccounts = [
    { role: 'Admin', email: 'admin@example.com', password: 'admin123' },
    { role: 'Tenant', email: 'tenant@example.com', password: 'tenant123' },
    { role: 'Owner', email: 'owner@example.com', password: 'owner123' }
  ];
  
  // Set demo credentials to the form
  const setDemoCredentials = (email, password) => {
    setFormData({ email, password });
  };

  // Pre-fill email if saved in localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Normalize the email
      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };
      
      console.log('🔐 Attempting login with MongoDB:', loginData.email);
      const response = await auth.login(loginData);
      
      // Check if this is a mock response
      const isMockResponse = response.data.token && response.data.token.includes('mock-jwt-token');
      if (isMockResponse) {
        console.log('⚠️ Using mock authentication - credentials stored locally only');
      } else {
        console.log('✅ Login successful with MongoDB:', response.data.user.email);
      }
      
      // Use the login function from AuthContext
      login(response.data.token, response.data.user);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Wait a moment before redirecting to ensure state is updated
      setTimeout(() => {
        // Navigate to the redirect path (either previous location or dashboard)
        navigate(from, { replace: true });
        setLoading(false);
      }, 300);
    } catch (err) {
      setLoginAttempts(prev => prev + 1);
      
      // Check if the error is connectivity related
      const isConnectivityError = 
        err.message && (
          err.message.includes('connect') || 
          err.message.includes('network') ||
          err.message.includes('offline') ||
          err.message.includes('server')
        );
      
      if (isConnectivityError) {
        setError(`Server connection error: ${err.message}. The app will work offline.`);
      } else if (err.notRegistered) {
        // Special case for users who haven't registered yet
        setError("This email is not registered. Please sign up first to access the application.");
      } else {
        // Extract the error message from the error object
        const errorMessage = err.message || 'Login failed. Please try again.';
        setError(errorMessage);
      }
      
      // Log additional details for debugging
      console.error('❌ Login error:', err);
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleDemoAccounts = () => setShowDemoAccounts(!showDemoAccounts);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Section - Brand & Image */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-700 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MzR8fHByb3BlcnR5fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              mixBlendMode: "overlay",
            }}
          ></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Bridgelease</h1>
          </div>
          <h2 className="text-4xl font-bold mt-12 leading-tight">
            Property Management <br /> Made Simple
          </h2>
          <div className="h-1 w-24 bg-white/30 my-6"></div>
          <p className="mt-4 text-blue-100 max-w-md">
            Streamline your property management experience with our all-in-one
            platform. Handle maintenance requests, tenant communications, and
            more with ease.
          </p>
        </div>

      
      </div>

      {/* Right Section - Login Form */}
      <div className="flex flex-col justify-center p-8 md:w-1/2 relative">
        {/* Mobile background - only visible on small screens */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 md:hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              mixBlendMode: "overlay",
            }}
          ></div>
          <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Bridgelease</h1>
          </div>
        </div>
        <div className="max-w-md mx-auto w-full relative z-10 bg-white p-6 rounded-lg shadow-lg md:shadow-none md:bg-transparent md:p-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>

          {/* Demo Accounts Card */}
          <div className="mb-6">
            

            {showDemoAccounts && (
              <div className="mt-2 p-4 bg-blue-50 rounded-md text-sm animate-fadeIn">
                <p className="text-gray-700 mb-2">
                  Choose a demo account to login with different roles:
                </p>
                <div className="space-y-2">
                  {demoAccounts.map((account, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() =>
                        setDemoCredentials(account.email, account.password)
                      }
                    >
                      <div className="flex items-center">
                        {account.role === "Admin" ? (
                          <Building size={16} className="mr-2 text-blue-600" />
                        ) : (
                          <User size={16} className="mr-2 text-blue-600" />
                        )}
                        <span className="font-medium">{account.role}</span>
                      </div>
                      <div className="text-gray-500">{account.email}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Click on any account to auto-fill the credentials.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md"
              role="alert"
            >
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>

              {error.includes("not registered") || error.includes("sign up") ? (
                <div className="mt-3 text-sm">
                  <div className="flex flex-col">
                    <p className="font-medium mb-2">
                      You need to create an account first:
                    </p>
                    <Link
                      to="/register"
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-center transition-colors"
                    >
                      Sign up now
                    </Link>
                  </div>
                </div>
              ) : loginAttempts > 2 ? (
                <div className="mt-2 text-sm">
                  <p>
                    Forgot your password?{" "}
                    <a href="#" className="text-red-700 underline">
                      Reset it here
                    </a>
                  </p>
                </div>
              ) : null}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-gray-400" />
                    ) : (
                      <Eye size={18} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>
            
          
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up now
                </Link>
              </p>
            </div>
          </div>
          

         


          <div className="mt-8 text-center text-xs text-gray-500">
            

         
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 