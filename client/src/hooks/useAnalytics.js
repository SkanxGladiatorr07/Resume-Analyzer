/**
 * useAnalytics Hook
 * Optimized hook for fetching analytics data with caching and memoization
 * 
 * @module hooks/useAnalytics
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

/**
 * In-memory cache for analytics data (client-side)
 * Reduces unnecessary API calls during the session
 */
const analyticsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if still valid
 * @param {string} key - Cache key
 * @returns {*} Cached data or null
 */
const getCached = (key) => {
  const cached = analyticsCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    analyticsCache.delete(key);
    return null;
  }
  
  return cached.data;
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 */
const setCached = (key, data) => {
  analyticsCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

/**
 * Hook for fetching dashboard summary
 * @returns {Object} Dashboard data, loading, error, and refresh function
 */
export const useDashboardSummary = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    const cacheKey = 'dashboard-summary';
    
    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/dashboard/summary');
      
      if (response.data.success) {
        const summaryData = response.data.data;
        setData(summaryData);
        setCached(cacheKey, summaryData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard summary');
      console.error('Dashboard summary error:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refresh: fetchData };
};

/**
 * Hook for fetching ATS score trend
 * @param {number} days - Number of days to fetch
 * @returns {Object} Chart data, loading, error, and refresh function
 */
export const useATSScoreTrend = (days = 30) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    const cacheKey = `ats-trend-${days}`;
    
    const cached = getCached(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/analytics/ats-trend?days=${days}`);
      
      if (response.data.success) {
        const trendData = response.data.data;
        setData(trendData);
        setCached(cacheKey, trendData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch ATS trend');
      console.error('ATS trend error:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refresh: fetchData };
};

/**
 * Hook for fetching multiple analytics charts
 * Optimized to fetch all charts in parallel
 * 
 * @param {Object} options - Options for chart fetching
 * @returns {Object} All chart data, loading state, errors, and refresh function
 */
export const useAnalyticsCharts = (options = {}) => {
  const { days = 30, enabled = true } = options;
  
  const [charts, setCharts] = useState({
    atsScore Trend: null,
    uploadTimeline: null,
    skillDistribution: null,
    matchSuccessRate: null,
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  
  const fetchAllCharts = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setErrors({});
    
    // Fetch all charts in parallel
    const requests = [
      api.get(`/analytics/ats-trend?days=${days}`).catch(err => ({ error: err, chart: 'atsScoreTrend' })),
      api.get(`/analytics/upload-timeline?days=${days}`).catch(err => ({ error: err, chart: 'uploadTimeline' })),
      api.get('/analytics/skill-distribution').catch(err => ({ error: err, chart: 'skillDistribution' })),
      api.get(`/analytics/match-success?days=${days}`).catch(err => ({ error: err, chart: 'matchSuccessRate' })),
    ];
    
    const results = await Promise.all(requests);
    
    const newCharts = {};
    const newErrors = {};
    
    results.forEach((result, index) => {
      const chartNames = ['atsScoreTrend', 'uploadTimeline', 'skillDistribution', 'matchSuccessRate'];
      const chartName = chartNames[index];
      
      if (result.error) {
        newErrors[chartName] = result.error.response?.data?.message || 'Failed to fetch';
      } else if (result.data?.success) {
        newCharts[chartName] = result.data.data;
      }
    });
    
    setCharts(newCharts);
    setErrors(newErrors);
    setLoading(false);
  }, [days, enabled]);
  
  useEffect(() => {
    fetchAllCharts();
  }, [fetchAllCharts]);
  
  return {
    charts,
    loading,
    errors,
    refresh: fetchAllCharts,
  };
};

/**
 * Hook for fetching recent activity
 * @param {number} limit - Number of activities to fetch
 * @returns {Object} Activity data, loading, error, and refresh function
 */
export const useRecentActivity = (limit = 10) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    const cacheKey = `recent-activity-${limit}`;
    
    const cached = getCached(cacheKey);
    if (cached) {
      setActivities(cached);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/analytics/recent-activity?limit=${limit}`);
      
      if (response.data.success) {
        const activityData = response.data.data;
        setActivities(activityData);
        setCached(cacheKey, activityData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch activities');
      console.error('Recent activity error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { activities, loading, error, refresh: fetchData };
};

/**
 * Clear analytics cache
 * Useful when data is updated and needs to be refetched
 */
export const clearAnalyticsCache = () => {
  analyticsCache.clear();
};

/**
 * Memoized chart options generator
 * Prevents unnecessary re-renders when chart config doesn't change
 * 
 * @param {string} title - Chart title
 * @param {Object} customOptions - Custom chart options
 * @returns {Object} Merged chart options
 */
export const useChartOptions = (title, customOptions = {}) => {
  return useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
      ...customOptions.plugins,
    },
    ...customOptions,
  }), [title, customOptions]);
};

export default {
  useDashboardSummary,
  useATSScoreTrend,
  useAnalyticsCharts,
  useRecentActivity,
  clearAnalyticsCache,
  useChartOptions,
};
