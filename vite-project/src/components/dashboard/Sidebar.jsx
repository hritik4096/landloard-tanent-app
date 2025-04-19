import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { generateAvatarUrl } from '../../utils/avatarUtils';
import { 
  Home, 
  Clipboard, 
  MessageSquare, 
  Users, 
  FileText, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  ChevronRight, 
  Menu, 
  X,
  Building
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  // Define menu items with access control
  const menuItems = [
    {
      title: 'Dashboard',
      icon: <Home size={20} />,
      path: '/dashboard',
      active: location.pathname === '/dashboard',
    },
    {
      title: 'Maintenance',
      icon: <Clipboard size={20} />,
      path: '/maintenance',
      active: location.pathname.includes('/maintenance'),
    },
    {
      title: 'Messages',
      icon: <MessageSquare size={20} />,
      path: '/messages',
      active: location.pathname.includes('/messages'),
      badge: 3, // Unread messages count
    },
    {
      title: 'Documents',
      icon: <FileText size={20} />,
      path: '/documents',
      active: location.pathname.includes('/documents'),
    },

    // Admin-only menu items
    ...(isAdmin ? [
      {
        title: 'Properties',
        icon: <Building size={20} />,
        path: '/properties',
        active: location.pathname.includes('/properties'),
      },
      {
        title: 'Tenants',
        icon: <Users size={20} />,
        path: '/tenants',
        active: location.pathname.includes('/tenants'),
      }
    ] : []),
    // Divider (will be rendered as a separator)
    { divider: true },
    // Settings and help available to all users
    {
      title: 'Settings',
      icon: <Settings size={20} />,
      path: '/settings',
      active: location.pathname.includes('/settings'),
    },
    {
      title: 'Help & Support',
      icon: <HelpCircle size={20} />,
      path: '/help',
      active: location.pathname.includes('/help'),
    }
  ];

  // Mobile toggle button (outside sidebar)
  const mobileToggle = (
    <button
      onClick={toggleMobileSidebar}
      className="lg:hidden fixed bottom-4 right-4 z-30 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors"
    >
      {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeMobileSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-20 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 
          ${isCollapsed ? "w-[70px]" : "w-64"} 
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
          {!isCollapsed && (
            <Link to="/dashboard" className="font-bold text-xl dark:text-white">
              Bridgelease
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 lg:block hidden"
          >
            <ChevronRight
              size={20}
              className={`transform transition-transform ${
                isCollapsed ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        {/* User profile section */}
        <div
          className={`p-4 border-b dark:border-gray-700 ${
            isCollapsed ? "text-center" : "flex items-center"
          }`}
        >
          <div className={`${isCollapsed ? "mx-auto" : "mr-3"} relative`}>
            <img
              src={generateAvatarUrl(user)}
              alt="User avatar"
              className="w-10 h-10 rounded-full"
            />
            <span className="w-3 h-3 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-white dark:border-gray-800"></span>
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="font-medium truncate dark:text-white">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                {user?.role || "User"}
              </p>
            </div>
          )}
        </div>

        {/* Navigation menu */}
        <nav className="p-2 overflow-y-auto h-[calc(100vh-150px)]">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              // Render divider
              if (item.divider) {
                return (
                  <li key={`divider-${index}`} className="my-3">
                    <div className="border-t dark:border-gray-700"></div>
                  </li>
                );
              }

              // Render menu item
              return (
                <li key={item.title}>
                  <Link
                    to={item.path}
                    onClick={closeMobileSidebar}
                    className={`flex items-center ${
                      isCollapsed ? "justify-center" : "justify-between"
                    } px-3 py-2.5 rounded-lg transition-colors
                      ${
                        item.active
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                  >
                    <div
                      className={`flex items-center ${
                        isCollapsed ? "" : "gap-3"
                      }`}
                    >
                      <span
                        className={`${isCollapsed ? "" : "w-5"} flex-shrink-0`}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && <span>{item.title}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}

                    {isCollapsed && item.badge && (
                      <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Version info at bottom */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-3 text-xs text-center text-gray-500 dark:text-gray-400 border-t dark:border-gray-700">
            Bridgelease v1.0.0
          </div>
        )}
      </aside>

      {/* Mobile toggle button */}
      {mobileToggle}

      {/* Main content spacing for non-collapsed sidebar */}
      <div
        className={`${
          isCollapsed ? "lg:ml-[70px]" : "lg:ml-64"
        } transition-all duration-300`}
      >
        {/* Your content goes here */}
      </div>
    </>
  );
};

export default Sidebar; 