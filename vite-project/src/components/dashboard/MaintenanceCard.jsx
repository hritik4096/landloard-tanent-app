import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PenTool as Tool, Clock, AlertTriangle, RefreshCw, User } from 'lucide-react';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useNavigate } from 'react-router-dom';
import { generateAvatarUrl } from '../../utils/avatarUtils';

const MaintenanceCard = () => {
  const { requests, loading, fetchRequests } = useMaintenance();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const timerRef = useRef(null);
  
  // Intelligent fetch that only updates when needed
  const intelligentFetch = useCallback(async () => {
    try {
      // Avoid UI disruption by setting refreshing only if this takes longer than expected
      const timeoutId = setTimeout(() => setRefreshing(true), 500);
      
      await fetchRequests();
      setLastRefreshed(Date.now());
      
      // Clear timeout to prevent setting refreshing if finished quickly
      clearTimeout(timeoutId);
    } catch (err) {
      console.error("Error refreshing maintenance data:", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRequests]);
  
  // Setup/cleanup auto-refresh when enabled state changes
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Initial fetch on mount
    intelligentFetch();
    
    // Only set up interval if auto-refresh is enabled
    if (autoRefreshEnabled) {
      timerRef.current = setInterval(() => {
        // Only fetch if the component is visible (document not hidden)
        if (!document.hidden) {
          intelligentFetch();
        }
      }, 60000); // Changed to every minute instead of 30 seconds
    }
    
    // Clean up interval on unmount or when autoRefreshEnabled changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoRefreshEnabled, intelligentFetch]);
  
  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRequests();
      setLastRefreshed(Date.now());
    } catch (err) {
      console.error("Error refreshing maintenance data:", err);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(prev => !prev);
  };
  
  // Get the most recent 3 maintenance requests
  const recentRequests = requests
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  // Format date to be more readable
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time elapsed since creation
  const getTimeElapsed = (dateString) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffInMs = now - created;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tool size={20} className="text-blue-500" />
          Recent Maintenance Requests
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-500 transition-colors"
            title="Refresh maintenance requests"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <a href="/maintenance" className="text-blue-500 hover:underline">View All</a>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4 flex justify-between items-center">
        <button 
          onClick={toggleAutoRefresh}
          className={`flex items-center gap-1 ${autoRefreshEnabled ? 'text-blue-500' : 'text-gray-400'}`}
        >
          <input 
            type="checkbox" 
            checked={autoRefreshEnabled} 
            onChange={toggleAutoRefresh} 
            className="h-3 w-3" 
          />
          <span>Auto-refresh {autoRefreshEnabled ? 'enabled' : 'disabled'}</span>
        </button>
        <span>Last updated: {new Date(lastRefreshed).toLocaleTimeString()}</span>
      </div>

      {loading || refreshing ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : recentRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg">
          <Tool size={24} className="mx-auto mb-2 text-gray-400" />
          <p>No maintenance requests found</p>
          <button 
            onClick={() => navigate('/maintenance')}
            className="mt-2 text-blue-500 hover:underline text-sm"
          >
            Create your first request
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recentRequests.map((request) => (
            <div 
              key={`${request._id}`} 
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate('/maintenance')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0">
                    {request.createdBy && typeof request.createdBy === 'object' ? (
                      <img 
                        src={generateAvatarUrl(request.createdBy)} 
                        alt="User avatar" 
                        className="h-6 w-6 object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <User size={12} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium">{request.title}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  request.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {request.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                {request.description}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatDate(request.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle size={14} className={
                      request.priority === 'high' ? 'text-red-500' :
                      request.priority === 'medium' ? 'text-yellow-500' :
                      'text-green-500'
                    } />
                    {request.priority} priority
                  </span>
                </div>
                <span className="italic">{getTimeElapsed(request.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaintenanceCard;