import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/dashboard/Header";
import {
  User,
  Bell,
  Lock,
  Camera,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle,
  X,
  MessageSquare,
  DollarSign,
  Info,
  Calendar,
  Wrench,
  BellOff,
} from "lucide-react";

const TABS = {
  profile: { icon: User, label: "Profile" },
};
const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    activeTab: "profile",
    darkMode: localStorage.getItem("darkMode") === "true",
    loading: true,
    filterType: "all",
    toast: {
      visible: false,
      message: "",
      type: "success",
      animating: false,
    },
    profile: JSON.parse(localStorage.getItem("user") || "{}"),
    notifications: JSON.parse(
      localStorage.getItem("userNotifications") || "[]"
    ),
    password: { current: "", new: "", confirm: "" },
  });

  // After the state declarations, define showToast first
  const [newNotificationsArrived, setNewNotificationsArrived] = useState(false);

  // Define showToast first before it's used by other functions
  const showToast = useCallback((message, type = "success") => {
    // Helper function for setting toast state
    const setToastState = (visible, animating = false) => {
      setSettings((prev) => ({
        ...prev,
        toast: {
          ...prev.toast,
          visible,
          animating,
          message: visible ? message : prev.toast.message,
          type: visible ? type : prev.toast.type,
        },
      }));
    };

    if (settings.toast.visible) {
      // Hide current toast
      setToastState(false, true);

      // Wait for animation to complete, then show new toast
      setTimeout(() => {
        setToastState(true, false);

        // Auto-hide after 3 seconds
        setTimeout(() => setToastState(false, true), 3000);
      }, 300);
    } else {
      // Show toast immediately
      setToastState(true, false);

      // Auto-hide after 3 seconds
      setTimeout(() => setToastState(false, true), 3000);
    }
  }, []); // Empty dependency array to prevent infinite re-renders

  // Update settings helper with useCallback
  const updateSettings = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Now define refreshNotifications after showToast
  const refreshNotifications = useCallback(() => {
    try {
      // Get maintenance notifications from localStorage
      const maintenanceData = JSON.parse(
        localStorage.getItem("maintenanceRequests") || "[]"
      );

      // Map maintenance requests to notification format
      const maintenanceNotifications = maintenanceData.map((request) => ({
        id:
          request._id ||
          `maintenance-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        type: "maintenance",
        title: `Maintenance Request: ${request.title || "Untitled"}`,
        message: `Status: ${request.status || "pending"}`,
        status: request.status || "pending",
        date: request.createdAt || new Date().toISOString(),
        read: false,
      }));

      // Get scheduled bookings from localStorage
      const scheduledBookings = JSON.parse(
        localStorage.getItem("scheduledBookings") || "[]"
      );

      // Map scheduled bookings to notification format
      const scheduleNotifications = scheduledBookings.map((booking) => ({
        id:
          booking.id ||
          `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "schedule",
        title: `Scheduled: ${booking.title || "Appointment"}`,
        message: `${booking.description || ""} on ${new Date(
          booking.date || Date.now()
        ).toLocaleDateString()} at ${booking.time || "scheduled time"}`,
        status: booking.status || "upcoming",
        date: booking.createdAt || new Date().toISOString(),
        read: false,
      }));

      // Combine all notifications and sort by date
      const combinedNotifications = [
        ...maintenanceNotifications,
        ...scheduleNotifications,
        ...SAMPLE_NOTIFICATIONS,
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      // Get current notifications from settings
      const currentNotifications = JSON.parse(
        localStorage.getItem("userNotifications") || "[]"
      );

      // Check if there are new notifications
      if (currentNotifications.length > 0) {
        // Check if we have any new notifications by comparing IDs
        const currentIds = new Set(currentNotifications.map((n) => n.id));
        const newItems = combinedNotifications.filter(
          (n) => !currentIds.has(n.id)
        );

        if (newItems.length > 0) {
          setNewNotificationsArrived(true);

          // Play notification sound if available
          const notificationSound =
            document.getElementById("notification-sound");
          if (notificationSound) {
            notificationSound
              .play()
              .catch((e) => console.error("Error playing sound:", e));
          }
        }
      }

      // Save notifications to localStorage to persist between refreshes
      localStorage.setItem(
        "userNotifications",
        JSON.stringify(combinedNotifications)
      );

      // Update state with new notifications
      setSettings((prev) => ({
        ...prev,
        loading: false,
        notifications: combinedNotifications,
      }));

      return combinedNotifications;
    } catch (error) {
      console.error("Error refreshing notifications:", error);
      setSettings((prev) => ({
        ...prev,
        loading: false,
      }));
      return [];
    }
  }, []); // Empty dependency array to avoid infinite renders

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedProfile = { ...settings.profile, avatar: reader.result };
      updateSettings("profile", updatedProfile);
      localStorage.setItem("user", JSON.stringify(updatedProfile));
      showToast("Profile picture updated successfully", "success");
    };
    reader.readAsDataURL(file);
  };

  const toggleTheme = () => {
    const newTheme = !settings.darkMode;
    updateSettings("darkMode", newTheme);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    showToast(`Theme changed to ${newTheme ? "dark" : "light"} mode`, "info");
  };

  const handleSubmit = (type) => async (e) => {
    e.preventDefault();
    const button = e.target.querySelector("button");
    const originalText = button.textContent;

    try {
      if (type === "profile") {
        localStorage.setItem("user", JSON.stringify(settings.profile));
        showToast("Profile updated successfully", "success");
      } else if (type === "password") {
        if (settings.password.new !== settings.password.confirm) {
          throw new Error("Passwords do not match");
        }

        // Simulate password change
        updateSettings("password", { current: "", new: "", confirm: "" });
        showToast("Password changed successfully", "success");
      }
      button.textContent = "Saved!";
    } catch (error) {
      button.textContent = error.message || "Error!";
      showToast(error.message || "An error occurred", "error");
    } finally {
      setTimeout(() => (button.textContent = originalText), 2000);
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = settings.notifications.map((n) => ({
      ...n,
      read: true,
    }));
    updateSettings("notifications", updatedNotifications);
    showToast("All notifications marked as read", "info");
  };

  const dismissNotification = (id) => {
    updateSettings(
      "notifications",
      settings.notifications.filter((item) => item.id !== id)
    );
    showToast("Notification dismissed", "info");
  };

  const clearAllNotifications = () => {
    updateSettings("notifications", []);
    showToast("All notifications cleared", "info");
  };

  // Filter notifications based on selected type
  const filteredNotifications = settings.notifications.filter(
    (n) => settings.filterType === "all" || n.type === settings.filterType
  );

  // Add this after the filteredNotifications line to track counts of different notification types
  const scheduleNotificationCount = settings.notifications.filter(
    (n) => n.type === "schedule" && !n.read
  ).length;

  // Update the tab click handler to reset the new notifications indicator
  const handleTabClick = useCallback(
    (tabKey) => {
      // If clicking on the notifications tab, reset the new notification indicator
      if (tabKey === "notifications") {
        setNewNotificationsArrived(false);
      }

      // Update the active tab
      updateSettings("activeTab", tabKey);
    },
    [updateSettings]
  );

  // Update useEffect to properly handle refreshNotifications
  useEffect(() => {
    // Initialize theme from localStorage
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Update localStorage darkMode value when darkMode state changes
    localStorage.setItem("darkMode", settings.darkMode.toString());
  }, [settings.darkMode]);

  // Separate useEffect for notifications to avoid dependency cycles
  useEffect(() => {
    // Set loading state
    setSettings((prev) => ({ ...prev, loading: true }));

    // Initial refresh
    refreshNotifications();

    // Set up interval to check for new notifications every 30 seconds
    const intervalId = setInterval(refreshNotifications, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshNotifications]);

  if (settings.loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />

      {/* Notification sound */}
      <audio
        id="notification-sound"
        src="https://assets.mixkit.co/sfx/preview/mixkit-software-interface-notification-212.mp3"
        preload="auto"
      ></audio>

      {/* Toast Notification */}
      {(settings.toast.visible || settings.toast.animating) && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 max-w-xs text-gray-500 rounded-lg shadow 
            ${
              settings.toast.type === "success"
                ? "bg-green-50 dark:bg-green-800 dark:text-green-200"
                : settings.toast.type === "error"
                ? "bg-red-50 dark:bg-red-800 dark:text-red-200"
                : "bg-blue-50 dark:bg-blue-800 dark:text-blue-200"
            } 
            ${
              settings.toast.visible
                ? "animate-fade-in-down"
                : "animate-fade-out-up"
            }`}
          role="alert"
        >
          <div
            className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg 
            ${
              settings.toast.type === "success"
                ? "bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-200"
                : settings.toast.type === "error"
                ? "bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-200"
                : "bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-200"
            }`}
          >
            {settings.toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : settings.toast.type === "error" ? (
              <X className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <div className="ml-3 text-sm font-normal">
            {settings.toast.message}
          </div>
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                toast: { ...prev.toast, visible: false, animating: true },
              }))
            }
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-white">Settings</h2>
            
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <nav className="sm:w-48">
              {Object.entries(TABS).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  onClick={() => handleTabClick(key)}
                  className={`w-full text-left px-4 py-2 rounded-lg mb-2 flex items-center ${
                    settings.activeTab === key
                      ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  <div
                    className={`${
                      key === "notifications" && newNotificationsArrived
                        ? "relative"
                        : ""
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`mr-2 ${
                        key === "notifications" && newNotificationsArrived
                          ? "text-blue-500 dark:text-blue-400"
                          : ""
                      }`}
                    />
                    {key === "notifications" && newNotificationsArrived && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-notification-pulse"></span>
                    )}
                  </div>
                  {label}
                  {key === "notifications" &&
                    settings.notifications.some((n) => !n.read) && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {settings.notifications.filter((n) => !n.read).length}
                      </span>
                    )}
                </button>
              ))}
            </nav>

            <div className="flex-1">
              {settings.activeTab === "profile" && (
                <form onSubmit={handleSubmit("profile")} className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        {settings.profile.avatar ? (
                          <img
                            src={settings.profile.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-full h-full p-4 text-gray-400" />
                        )}
                        <label className="absolute bottom-0 right-0 p-1 bg-blue-500 rounded-full cursor-pointer">
                          <Camera size={16} className="text-white" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium dark:text-white">
                        {settings.profile.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {settings.profile.role}
                      </p>
                    </div>
                  </div>

                  {["name", "email"].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {field}
                      </label>
                      <input
                        type={field === "email" ? "email" : "text"}
                        value={settings.profile[field] || ""}
                        onChange={(e) =>
                          updateSettings("profile", {
                            ...settings.profile,
                            [field]: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2"
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
