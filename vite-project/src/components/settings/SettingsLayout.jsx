import React, { useState } from 'react';
import { User, Bell, Lock, Shield, CreditCard, HelpCircle } from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { generateAvatarUrl } from '../../utils/avatarUtils';

const SettingsLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  // Define settings tabs with access control
  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User size={18} />,
      path: '/settings/profile',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={18} />,
      path: '/settings/notifications',
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Lock size={18} />,
      path: '/settings/security',
    },
    {
      id: 'payment',
      label: 'Payment Methods',
      icon: <CreditCard size={18} />,
      path: '/settings/payment',
    },
    ...(isAdmin ? [
      {
        id: 'admin',
        label: 'Admin Settings',
        icon: <Shield size={18} />,
        path: '/settings/admin',
      }
    ] : []),
    {
      id: 'help',
      label: 'Help & Support',
      icon: <HelpCircle size={18} />,
      path: '/settings/help',
    }
  ];

  // Extract the current active tab from the URL
  const currentTab = location.pathname.split('/').pop();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-4 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Settings Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              {/* User Profile Summary */}
              <div className="p-4 border-b dark:border-gray-700 flex items-center">
                <img
                  src={generateAvatarUrl(user)}
                  alt="Profile"
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {user?.name || "User"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role || "User"}
                  </p>
                </div>
              </div>

              {/* Settings Navigation */}
              <nav className="py-2">
                <ul>
                  {tabs.map((tab) => (
                    <li key={tab.id}>
                      <Link
                        to={tab.path}
                        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors
                          ${
                            currentTab === tab.id ||
                            (currentTab === "settings" && tab.id === "profile")
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                      >
                        <span className="mr-3 text-gray-500 dark:text-gray-400">
                          {tab.icon}
                        </span>
                        {tab.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Additional Help Card */}
            <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Need help?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Contact our support team for assistance with any issues.
              </p>
              <a
                href="mailto:support@Bridgelease.com"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                support@Bridgelease.com
              </a>
            </div>
          </div>

          {/* Settings Content Area */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout; 