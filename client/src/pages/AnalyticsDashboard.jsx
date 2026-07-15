/**
 * Analytics Dashboard Page
 * Comprehensive analytics and statistics for user's resumes
 */

import { useState, useEffect } from 'react';
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardService, resumeService } from '../services';
import { NotificationBanner } from '../components';
import {
  StatCard,
  ChartCard,
  RecentItem,
  QuickActions,
  ActivityTimeline,
  EmptyStateCard,
  DashboardSkeleton,
  StatsGridSkeleton,
  ChartCardSkeleton,
} from '../components/dashboard';
import { handleApiError } from '../utils/errorHandler';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();

  // State management
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartsLoading, setIsChartsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  /**
   * Fetch dashboard data on mount
   */
  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Auto-dismiss success messages
   */
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /**
   * Auto-dismiss error messages
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * Fetch all dashboard data
   */
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setIsChartsLoading(true);
      setError(null);

      // Fetch overview first (faster response)
      const overviewRes = await dashboardService.getDashboardOverview();
      setOverview(overviewRes.data);
      setIsLoading(false);

      // Transform overview data to activity timeline
      const activities = transformToActivities(overviewRes.data);
      setRecentActivity(activities);

      // Fetch chart data (can be slower)
      const chartsRes = await dashboardService.getChartData({
        days: 30,
        topSkills: 10,
        topMissingSkills: 5,
      });
      setChartData(chartsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const errorMsg = handleApiError(err, 'Analytics Dashboard');
      setError(errorMsg);
      setIsLoading(false);
    } finally {
      setIsChartsLoading(false);
    }
  };

  /**
   * Transform overview data to activity timeline format
   */
  const transformToActivities = (data) => {
    const activities = [];

    if (data.latestResume) {
      activities.push({
        id: `resume-${data.latestResume._id}`,
        type: 'upload',
        title: 'Resume uploaded',
        description: data.latestResume.fileName || 'Untitled Resume',
        timestamp: data.latestResume.uploadedAt || data.latestResume.createdAt,
      });
    }

    if (data.latestAnalysis) {
      activities.push({
        id: `analysis-${data.latestAnalysis._id}`,
        type: 'analysis',
        title: 'AI analysis completed',
        description: `ATS Score: ${data.latestAnalysis.atsScore || 'N/A'}%`,
        timestamp: data.latestAnalysis.analyzedAt || data.latestAnalysis.createdAt,
      });
    }

    if (data.latestJobMatch) {
      activities.push({
        id: `jobmatch-${data.latestJobMatch._id}`,
        type: 'jobMatch',
        title: 'Job comparison completed',
        description: data.latestJobMatch.jobTitle || 'Job Match',
        timestamp: data.latestJobMatch.comparedAt || data.latestJobMatch.createdAt,
      });
    }

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  /**
   * Quick Actions Handlers
   */
  const handleUploadResume = () => {
    navigate('/upload');
  };

  const handleAnalyzeResume = async () => {
    try {
      // Fetch user's resumes
      const response = await resumeService.getResumes();
      const resumes = response.data || [];

      if (resumes.length === 0) {
        setError('No resumes found. Please upload a resume first.');
        return;
      }

      // Navigate to the most recent resume details
      navigate(`/resume/${resumes[0]._id}`);
    } catch (err) {
      const errorMsg = handleApiError(err, 'Analyze Resume');
      setError(errorMsg);
    }
  };

  const handleCompareJob = () => {
    navigate('/job-match');
  };

  const handleViewHistory = () => {
    navigate('/dashboard');
  };

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

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
      {overview ? (
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
      ) : (
        <StatsGridSkeleton />
      )}

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
          <ActivityTimeline activities={recentActivity} isLoading={false} />
        </div>
      )}

      {/* Charts Section */}
      {chartData ? (
        <div className="space-y-8 mb-8">
          {/* ATS Score Trend */}
          {chartData.atsScoreTrend && chartData.atsScoreTrend.data.length > 0 && (
            <ChartCard
              title="ATS Score Trend"
              description="Track your ATS score improvements over time"
            >
              <ResponsiveContainer width="100%" height={300}>
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
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Resume Upload Timeline & Skills Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Timeline */}
            {chartData.uploadTimeline && chartData.uploadTimeline.data.length > 0 && (
              <ChartCard
                title="Resume Upload Timeline"
                description="Your resume upload activity"
              >
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.uploadTimeline.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Skills Distribution */}
            {chartData.skillsDistribution && chartData.skillsDistribution.data.length > 0 && (
              <ChartCard
                title="Top Skills Distribution"
                description="Most common skills in your resumes"
              >
                <ResponsiveContainer width="100%" height={250}>
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
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* Job Match Score & ATS Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Job Match Score Distribution */}
            {chartData.jobMatchScoreDistribution &&
              chartData.jobMatchScoreDistribution.data.length > 0 && (
                <ChartCard
                  title="Job Match Score Distribution"
                  description="Distribution of your job match scores"
                >
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData.jobMatchScoreDistribution.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

            {/* ATS Score Distribution */}
            {chartData.atsScoreDistribution &&
              chartData.atsScoreDistribution.data.length > 0 && (
                <ChartCard
                  title="ATS Score Distribution"
                  description="How your resumes score across ranges"
                >
                  <ResponsiveContainer width="100%" height={250}>
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
                  </ResponsiveContainer>
                </ChartCard>
              )}
          </div>

          {/* Missing Skills */}
          {chartData.missingSkills && chartData.missingSkills.data.length > 0 && (
            <ChartCard
              title="Most Common Missing Skills"
              description="Skills you might want to add to improve your resumes"
            >
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.missingSkills.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="frequency" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      ) : isChartsLoading ? (
        <div className="space-y-8 mb-8">
          <ChartCardSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        </div>
      ) : null}

      {/* Recent Items Section */}
      {overview && (overview.latestResume || overview.latestAnalysis || overview.latestJobMatch) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Recent Resume */}
          {overview.latestResume && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Resume</h3>
              <RecentItem
                type="resume"
                item={overview.latestResume}
                onClick={() => navigate(`/resume/${overview.latestResume._id}`)}
              />
            </div>
          )}

          {/* Recent Analysis */}
          {overview.latestAnalysis && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analysis</h3>
              <RecentItem
                type="analysis"
                item={overview.latestAnalysis}
                onClick={() => navigate(`/analysis/${overview.latestAnalysis._id}`)}
              />
            </div>
          )}

          {/* Recent Job Match */}
          {overview.latestJobMatch && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Job Match</h3>
              <RecentItem
                type="jobMatch"
                item={overview.latestJobMatch}
                onClick={() => navigate('/job-match-history')}
              />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {overview && overview.totalResumes === 0 && (
        <EmptyStateCard
          icon="📊"
          title="No Analytics Yet"
          description="Upload your first resume to start tracking your analytics and insights."
          action={
            <button
              onClick={() => navigate('/upload')}
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
