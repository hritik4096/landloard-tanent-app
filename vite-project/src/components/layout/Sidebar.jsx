import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, PenTool as Tool, Calendar, DollarSign, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { user, logout } = useAuth();

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const menuItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Tool size={20} />, label: 'Maintenance', path: '/maintenance' },
    { icon: <MessageSquare size={20} />, label: 'Messages', path: '/messages' },
    { icon: <Calendar size={20} />, label: 'Schedule', path: '/schedule' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ];

  // Function to determine active link class
  const getLinkClass = ({ isActive }) => 
    `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md' 
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`;

  // Improved logout handler
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Mobile toggle button
  const MobileMenuToggle = () => (
    <button 
      className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-gray-900 text-white md:hidden"
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    >
      {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  );

  const sidebarClasses = `
    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
    md:translate-x-0
    h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 
    fixed left-0 top-0 shadow-xl overflow-y-auto transition-transform duration-300 z-30
  `;

  return (
    <>
      <MobileMenuToggle />

      <div className={sidebarClasses}>
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
            <Home size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
            Bridgelease
          </h1>
        </div>

        {/* User profile section */}
        <div className="mb-8 p-3 bg-gray-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-medium">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <p className="font-medium text-white">{user?.name || "User"}</p>
              <p className="text-xs text-gray-400">
                {user?.role === "tenant" ? "Tenant" : "Property Manager"}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold ml-3">
            Menu
          </p>
        </div>

        <nav className="mb-8">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  className={getLinkClass}
                  end={item.path === "/dashboard"}
                  onClick={closeMobileMenu}
                >
                  <span className="text-blue-400">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pt-6 mt-auto border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 transition-all duration-200 w-full text-white shadow-md"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}
    </>
  );
};

export default Sidebar;