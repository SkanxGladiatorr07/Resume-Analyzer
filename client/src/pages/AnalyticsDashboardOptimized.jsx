/**
 * Analytics Dashboard Page (Optimized)
 * Comprehensive analytics with performance optimizations:
 * - Custom hook for data management
 * - Memoized chart components
 * - Optimized re-renders
 * - Automatic caching
 * 
 * @module AnalyticsDashboardOptimized
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { resumeService } from '../services';
import { NotificationBanner } from '../components';
import {
  StatCard,
  ChartCard,
  QuickActions,
  ActivityTimeline,
  EmptyStateCard,
  DashboardSkeleton,
  StatsGridSkeleton,
  ChartCardSkeleton,
  OptimizedChart,
} from '../components/dashboard';
import { handleApiError } from '../utils/errorHandler';
import { useDashboard } from '../hooks/useDashboard';

/**
 * Analytics Dashboard Component
 * 
 * @returns {JSX.Element} Dashboard page
 */
const AnalyticsDashboard = () => {
  const navigate = useNavigate();

  // State for notifications
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Use custom dashboard hook with caching
  const {
    overview,
    chartData,
    activities,
    isLoading,
    isChartsLoading,
    error: dashboardError,
    refresh,
  } = useDashboard({
    autoLoad: true,
    loadCharts: true,
    chartDays: 30,
    topSkills: 10,
    topMissingSkills: 5,
  });

  /**
   * Sync dashboard errors to local error state
   */
  useEffect(() => {
    if (dashboardError) {
      setError(dashboardError);
    }
  }, [dashboardError]);

  /**
   * Auto-dismiss success messages
   */
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /**
   * Auto-dismiss error messages
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * Quick Actions Handlers (memoized to prevent re-renders)
   */
  const handleUploadResume = useCallback(() => {
    navigate('/upload');
  }, [navigate]);

  const handleAnalyzeResume = useCallback(async () => {
    try {
      const response = await resumeService.getResumes();
      const resumes = response.data || [];

      if (resumes.length === 0) {
        setError('No resumes found. Please upload a resume first.');
        return;
      }

      navigate(`/resume/${resumes[0]._id}`);
    } catch (err) {
      const errorMsg = handleApiError(err, 'Analyze Resume');
      setError(errorMsg);
    }
  }, [navigate]);

  const handleCompareJob = useCallback(() => {
    navigate('/job-match');
  }, [navigate]);

  const handleViewHistory = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  /**
   * Chart colors (memoized)
   */
  const COLORS = useMemo(() => ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'], []);

  /**
   * Render stats cards (memoized)
   */
  const statsCards = useMemo(() => {
    if (!overview) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Resumes"
          value={overview.totalResumes || 0}
          icon="document"
          color="blue"
          subtitle="Uploaded resumes"
        />
        <StatCard
          title="Average ATS Score"
          value={overview.avgAtsScore ? `${overview.avgAtsScore}%` : 'N/A'}
          icon="star"
          color="green"
          subtitle="Applicant Tracking System"
        />
        <StatCard
          title="Total Job Matches"
          value={overview.totalJobMatches || 0}
          icon="briefcase"
          color="purple"
          subtitle="Comparisons completed"
        />
        <StatCard
          title="Resume Completeness"
          value={overview.avgCompletenessScore ? `${overview.avgCompletenessScore}%` : 'N/A'}
          icon="chart"
          color="orange"
          subtitle="Average completeness"
        />
      </div>
    );
  }, [overview]);

  /**
   * Render charts section (memoized)
   */
  const chartsSection = useMemo(() => {
    if (!chartData) return null;

    return (
      <div className="space-y-8 mb-8">
        {/* ATS Score Trend */}
        {chartData.atsScoreTrend && chartData.atsScoreTrend.data.length > 0 && (
          <ChartCard
            title="ATS Score Trend"
            description="Track your ATS score improvements over time"
          >
            <OptimizedChart height={300}>
              <LineChart data={chartData.atsScoreTrend.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </OptimizedChart>
          </ChartCard>
        )}

        {/* Upload Timeline & Skills Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {chartData.uploadTimeline && chartData.uploadTimeline.data.length > 0 && (
            <ChartCard
              title="Resume Upload Timeline"
              description="Your resume upload activity"
            >
              <OptimizedChart height={250}>
                <BarChart data={chartData.uploadTimeline.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </OptimizedChart>
            </ChartCard>
          )}

          {chartData.skillsDistribution && chartData.skillsDistribution.data.length > 0 && (
            <ChartCard
              title="Top Skills Distribution"
              description="Most common skills in your resumes"
            >
              <OptimizedChart height={250}>
                <BarChart
                  data={chartData.skillsDistribution.data}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="skill" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </OptimizedChart>
            </ChartCard>
          )}
        </div>

        {/* Job Match & ATS Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {chartData.jobMatchScoreDistribution &&
            chartData.jobMatchScoreDistribution.data.length > 0 && (
              <ChartCard
                title="Job Match Score Distribution"
                description="Distribution of your job match scores"
              >
                <OptimizedChart height={250}>
                  <BarChart data={chartData.jobMatchScoreDistribution.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#F59E0B" />
                  </BarChart>
                </OptimizedChart>
              </ChartCard>
            )}

          {chartData.atsScoreDistribution &&
            chartData.atsScoreDistribution.data.length > 0 && (
              <ChartCard
                title="ATS Score Distribution"
                description="How your resumes score across ranges"
              >
                <OptimizedChart height={250}>
                  <PieChart>
                    <Pie
                      data={chartData.atsScoreDistribution.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.range}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {chartData.atsScoreDistribution.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </OptimizedChart>
              </ChartCard>
            )}
        </div>

        {/* Missing Skills */}
        {chartData.missingSkills && chartData.missingSkills.data.length > 0 && (
          <ChartCard
            title="Most Common Missing Skills"
            description="Skills you might want to add to improve your resumes"
          >
            <OptimizedChart height={250}>
              <BarChart data={chartData.missingSkills.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="skill" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="frequency" fill="#EF4444" />
              </BarChart>
            </OptimizedChart>
          </ChartCard>
        )}
      </div>
    );
  }, [chartData, COLORS]);

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Analytics Dashboard 📊
        </h1>
        <p className="text-lg text-gray-600">
          Track your resume performance and get insights to improve your applications.
        </p>
      </div>

      {/* Success Notification */}
      <NotificationBanner
        type="success"
        message={successMessage}
        onDismiss={() => setSuccessMessage(null)}
      />

      {/* Error Notification */}
      <NotificationBanner type="error" message={error} onDismiss={() => setError(null)} />

      {/* Top Stat Cards */}
      {overview ? statsCards : <StatsGridSkeleton />}

      {/* Quick Actions Section */}
      <div className="mb-8">
        <QuickActions
          onUpload={handleUploadResume}
          onAnalyze={handleAnalyzeResume}
          onCompare={handleCompareJob}
          onHistory={handleViewHistory}
        />
      </div>

      {/* Recent Activity Timeline */}
      {overview && overview.totalResumes > 0 && (
        <div className="mb-8">
          <ActivityTimeline activities={activities} isLoading={false} />
        </div>
      )}

      {/* Charts Section */}
      {chartData ? (
        chartsSection
      ) : isChartsLoading ? (
        <div className="space-y-8 mb-8">
          <ChartCardSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        </div>
      ) : null}

      {/* Empty State */}
      {overview && overview.totalResumes === 0 && (
        <EmptyStateCard
          icon="📊"
          title="No Analytics Yet"
          description="Upload your first resume to start tracking your analytics and insights."
          action={
            <button
              onClick={handleUploadResume}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Upload Resume
            </button>
          }
        />
      )}
    </div>
  );
};

export default AnalyticsDashboard;
