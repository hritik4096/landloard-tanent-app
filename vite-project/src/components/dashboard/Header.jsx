import React, { useState } from "react";
import {
  Bell,
  Search,
  User,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateAvatarUrl, getUserInitials } from "../../utils/avatarUtils";

const Header = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm p-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={20}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={toggleUserMenu}
            >
              {user ? (
                <img
                  src={generateAvatarUrl(user)}
                  alt={`${user.name || "User"}'s avatar`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={16} className="text-blue-600" />
                </div>
              )}
              <div className="hidden md:block">
                <p className="font-medium dark:text-gray-200">
                  {user?.name || "User"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || "User"}
                </p>
              </div>
              <ChevronDown
                size={16}
                className="text-gray-500 dark:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
