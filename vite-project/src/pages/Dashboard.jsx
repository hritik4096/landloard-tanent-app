import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMaintenance } from "../context/MaintenanceContext";
import { useAuth } from "../context/AuthContext";
import Header from "../components/dashboard/Header";
import MaintenanceCard from "../components/dashboard/MaintenanceCard";
import {
  Users,
  Building,
  Home,
  Settings,
  User,
  Clipboard,
  BarChart,
} from "lucide-react";
import { generateAvatarUrl } from "../utils/avatarUtils";

const Dashboard = () => {
  const { requests, loading, error, fetchRequests, updateRequest } =
    useMaintenance();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const initialLoadComplete = useRef(false);

  // Smart fetch function to avoid UI disruptions
  const smartFetch = useCallback(async () => {
    try {
      // Only show loading indicator if it takes longer than expected
      const loadingTimeout = setTimeout(() => setIsRefreshing(true), 500);

      await fetchRequests();

      // Clear timeout and update timestamp
      clearTimeout(loadingTimeout);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchRequests]);

  // Initial load only
  useEffect(() => {
    if (!initialLoadComplete.current) {
      smartFetch();
      initialLoadComplete.current = true;
    }
  }, [smartFetch]);

  // Manual refresh function that won't disrupt the UI
  const refreshData = () => {
    smartFetch();
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateRequest({ _id: id, status: newStatus });
      setLastUpdate(Date.now());
    } catch (err) {
      console.error("Error updating request status:", err);
    }
  };

  const handleRetry = () => {
    smartFetch();
  };

  // Calculate basic statistics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (req) => req.status === "pending"
  ).length;
  const completedRequests = requests.filter(
    (req) => req.status === "completed"
  ).length;

  // Filter requests by status if needed
  const filteredRequests =
    filterStatus === "all"
      ? requests
      : requests.filter((request) => request.status === filterStatus);

  // Get the most recent requests
  const recentRequests = [...filteredRequests]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            {isAdmin && (
              <p className="text-sm text-gray-500">Administrator View</p>
            )}
          </div>
          <button
            onClick={refreshData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            disabled={loading || isRefreshing}
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Admin Dashboard */}
        {isAdmin ? (
          <div className="animate-fadeIn">
            {/* Admin Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn delay-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider">
                      Pending Requests
                    </h3>
                    <p className="text-3xl font-bold text-yellow-700 mt-2">
                      {pendingRequests}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Clipboard className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn delay-400">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wider">
                      Completed
                    </h3>
                    <p className="text-3xl font-bold text-green-700 mt-2">
                      {completedRequests}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <BarChart className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance Requests Section for Admin */}
            <div className="bg-white rounded-lg shadow-md p-6 animate-fadeIn delay-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Recent Maintenance Requests
                </h2>
                <select
                  className="px-3 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {error && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                  role="alert"
                >
                  <span className="block sm:inline">{error}</span>
                  <button
                    onClick={handleRetry}
                    className="text-blue-500 hover:text-blue-700 ml-4"
                  >
                    Retry
                  </button>
                </div>
              )}

              {loading || isRefreshing ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-500"></div>
                </div>
              ) : recentRequests.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="mt-2 text-gray-500">
                    No {filterStatus !== "all" ? filterStatus : ""} maintenance
                    requests found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Request
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tenant
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Property
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Created
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentRequests.map((request) => (
                        <tr key={request._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.description?.substring(0, 40)}
                                {request.description?.length > 40 ? "..." : ""}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mr-2">
                                {request.createdBy &&
                                typeof request.createdBy === "object" ? (
                                  <img
                                    src={generateAvatarUrl(request.createdBy)}
                                    alt="User avatar"
                                    className="h-8 w-8 object-cover"
                                  />
                                ) : (
                                  <User size={16} className="text-gray-600" />
                                )}
                              </div>
                              <div className="text-sm text-gray-900">
                                {typeof request.createdBy === "object"
                                  ? request.createdBy.name ||
                                    request.createdBy.email ||
                                    "Unknown User"
                                  : request.createdBy || "John Doe"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              Unit {Math.floor(Math.random() * 10) + 1}
                            </div>
                            <div className="text-sm text-gray-500">
                              Building A
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                request.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : request.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {request.status === "pending" && (
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(
                                      request._id,
                                      "in-progress"
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Start
                                </button>
                              )}
                              {request.status === "in-progress" && (
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(request._id, "completed")
                                  }
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Complete
                                </button>
                              )}
                              <button className="text-gray-600 hover:text-gray-900">
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredRequests.length > 5 && (
                <div className="mt-6 text-center">
                  <a
                    href="/maintenance"
                    className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded transition-colors"
                  >
                    View All Maintenance Requests
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Tenant Dashboard (Original Layout)
          <div className="animate-fadeIn">
            {/* Statistics Cards with improved design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Requests Card */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn delay-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                      Total Requests
                    </h3>
                    <p className="text-3xl font-bold text-blue-700 mt-2">
                      {totalRequests}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Pending Requests Card */}
              <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn delay-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider">
                      Pending
                    </h3>
                    <p className="text-3xl font-bold text-yellow-700 mt-2">
                      {pendingRequests}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Completed Requests Card */}
              <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn delay-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wider">
                      Completed
                    </h3>
                    <p className="text-3xl font-bold text-green-700 mt-2">
                      {completedRequests}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Status Filter */}
            <div className="mb-6 animate-slideIn">
              <select
                className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              {/* Dynamic Maintenance Card Component - only pass a key if we need to force a refresh */}
              <MaintenanceCard />

              {/* Recent Filtered Maintenance Requests */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Filtered Maintenance Requests
                  </h2>
                  {error && (
                    <button
                      onClick={handleRetry}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Retry
                    </button>
                  )}
                </div>

                {error && (
                  <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                    role="alert"
                  >
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                {loading || isRefreshing ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-500"></div>
                  </div>
                ) : recentRequests.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="mt-2 text-gray-500">
                      No {filterStatus !== "all" ? filterStatus : ""}{" "}
                      maintenance requests found
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {recentRequests.map((request) => (
                      <div
                        key={request._id}
                        className="py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {request.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {request.description?.substring(0, 80)}
                              {request.description?.length > 80 ? "..." : ""}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  request.priority === "high"
                                    ? "bg-red-100 text-red-800"
                                    : request.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {request.priority}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  request.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : request.status === "in-progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {request.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className="text-sm text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredRequests.length > 5 && (
                      <div className="text-center mt-6 pt-4">
                        <a
                          href="/maintenance"
                          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded transition-colors"
                        >
                          View All Maintenance Requests
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
