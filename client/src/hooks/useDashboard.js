/**
 * useDashboard Hook
 * Custom hook for managing dashboard data with caching and optimization
 * 
 * @module useDashboard
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService } from '../services';
import { handleApiError } from '../utils/errorHandler';

/**
 * Dashboard data state
 * @typedef {Object} DashboardState
 * @property {Object|null} overview - Dashboard overview data
 * @property {Object|null} chartData - Chart data
 * @property {Array} activities - Recent activities array
 * @property {boolean} isLoading - Initial loading state
 * @property {boolean} isRefreshing - Refresh loading state
 * @property {boolean} isChartsLoading - Charts loading state
 * @property {string|null} error - Error message
 * @property {Function} refresh - Function to refresh dashboard data
 * @property {Function} invalidateCache - Function to invalidate cache
 */

/**
 * Hook options
 * @typedef {Object} UseDashboardOptions
 * @property {boolean} [autoLoad=true] - Auto-load data on mount
 * @property {boolean} [loadCharts=true] - Load chart data
 * @property {number} [chartDays=30] - Days for chart data
 * @property {number} [topSkills=10] - Number of top skills
 * @property {number} [topMissingSkills=5] - Number of missing skills
 * @property {Function} [onSuccess] - Success callback
 * @property {Function} [onError] - Error callback
 */

/**
 * Custom hook for dashboard data management
 * Provides optimized data fetching with caching and error handling
 * 
 * @param {UseDashboardOptions} [options={}] - Hook configuration options
 * @returns {DashboardState} Dashboard state and methods
 * 
 * @example
 * function DashboardPage() {
 *   const {
 *     overview,
 *     chartData,
 *     activities,
 *     isLoading,
 *     error,
 *     refresh
 *   } = useDashboard();
 * 
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error} />;
 * 
 *   return <Dashboard data={overview} charts={chartData} />;
 * }
 */
export const useDashboard = (options = {}) => {
  const {
    autoLoad = true,
    loadCharts = true,
    chartDays = 30,
    topSkills = 10,
    topMissingSkills = 5,
    onSuccess,
    onError,
  } = options;

  // State
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChartsLoading, setIsChartsLoading] = useState(loadCharts);
  const [error, setError] = useState(null);

  // Refs to prevent multiple concurrent requests
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  /**
   * Transform overview data to activities
   */
  const transformToActivities = useCallback((data) => {
    const activityList = [];

    if (data.latestResume) {
      activityList.push({
        id: `resume-${data.latestResume._id}`,
        type: 'upload',
        title: 'Resume uploaded',
        description: data.latestResume.fileName || 'Untitled Resume',
        timestamp: data.latestResume.uploadedAt || data.latestResume.createdAt,
      });
    }

    if (data.latestAnalysis) {
      activityList.push({
        id: `analysis-${data.latestAnalysis._id}`,
        type: 'analysis',
        title: 'AI analysis completed',
        description: `ATS Score: ${data.latestAnalysis.atsScore || 'N/A'}%`,
        timestamp: data.latestAnalysis.analyzedAt || data.latestAnalysis.createdAt,
      });
    }

    if (data.latestJobMatch) {
      activityList.push({
        id: `jobmatch-${data.latestJobMatch._id}`,
        type: 'jobMatch',
        title: 'Job comparison completed',
        description: data.latestJobMatch.jobTitle || 'Job Match',
        timestamp: data.latestJobMatch.comparedAt || data.latestJobMatch.createdAt,
      });
    }

    // Sort by timestamp (newest first)
    return activityList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, []);

  /**
   * Fetch dashboard data
   */
  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      // Prevent concurrent requests
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;

        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        if (loadCharts) {
          setIsChartsLoading(true);
        }

        setError(null);

        // Fetch overview first (faster)
        const overviewRes = await dashboardService.getDashboardOverview();

        if (!mountedRef.current) return;

        setOverview(overviewRes.data);
        setIsLoading(false);

        // Transform to activities
        const activityList = transformToActivities(overviewRes.data);
        setActivities(activityList);

        // Fetch charts if needed
        if (loadCharts) {
          const chartsRes = await dashboardService.getChartData({
            days: chartDays,
            topSkills,
            topMissingSkills,
          });

          if (!mountedRef.current) return;

          setChartData(chartsRes.data);
        }

        // Success callback
        if (onSuccess) {
          onSuccess(overviewRes.data, chartData);
        }
      } catch (err) {
        if (!mountedRef.current) return;

        console.error('Error fetching dashboard data:', err);
        const errorMsg = handleApiError(err, 'Dashboard');
        setError(errorMsg);

        // Error callback
        if (onError) {
          onError(err);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsChartsLoading(false);
          isFetchingRef.current = false;
        }
      }
    },
    [loadCharts, chartDays, topSkills, topMissingSkills, transformToActivities, onSuccess, onError, chartData]
  );

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(() => {
    // Invalidate cache before refresh
    dashboardService.invalidateDashboardCache();
    return fetchDashboardData(true);
  }, [fetchDashboardData]);

  /**
   * Invalidate cache
   */
  const invalidateCache = useCallback(() => {
    dashboardService.invalidateDashboardCache();
  }, []);

  /**
   * Auto-load on mount
   */
  useEffect(() => {
    if (autoLoad) {
      fetchDashboardData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    overview,
    chartData,
    activities,
    isLoading,
    isRefreshing,
    isChartsLoading,
    error,
    refresh,
    invalidateCache,
  };
};

export default useDashboard;
