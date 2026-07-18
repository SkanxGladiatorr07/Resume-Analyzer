/**
 * Enhanced Dashboard Page
 * Main dashboard with pinning, default resume, recent exports, and improved UX
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Card,
  Button,
  ResumeCard,
  ResumeUpload,
  EmptyState,
  NotificationBanner,
  ConfirmDialog,
} from '../components';
import {
  DashboardSkeleton,
  DefaultResumeCard,
  RecentExports,
} from '../components/dashboard';
import { resumeService } from '../services';

const DashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [resumes, setResumes] = useState([]);
  const [defaultResume, setDefaultResume] = useState(null);
  const [recentExports, setRecentExports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    resumeId: null,
    resumeName: '',
    isDeleting: false,
  });

  /**
   * Fetch all data on component mount
   */
  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Fetch resumes and recent exports
   */
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch resumes and exports in parallel
      const [resumesResponse, exportsResponse] = await Promise.all([
        resumeService.getResumes(),
        resumeService.getRecentExports(5).catch(() => ({ data: { history: [] } })),
      ]);

      const fetchedResumes = resumesResponse.data || [];
      setResumes(fetchedResumes);

      // Find default resume
      const defaultRes = fetchedResumes.find((r) => r.isDefault);
      setDefaultResume(defaultRes || null);

      // Set recent exports
      setRecentExports(exportsResponse.data?.history || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle successful upload
   */
  const handleUploadSuccess = async (file) => {
    try {
      setError(null);
      await resumeService.uploadResume(file);

      // Show success message
      setSuccessMessage(`${file.name} uploaded successfully!`);

      // Refresh dashboard
      await fetchDashboardData();

      // Hide upload section
      setShowUploadSection(false);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to upload resume. Please try again.';
      setError(errorMessage);
      throw error;
    }
  };

  /**
   * Handle upload error
   */
  const handleUploadError = (errorMessage) => {
    setError(errorMessage);
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  /**
   * Handle toggle pin
   */
  const handleTogglePin = async (resumeId) => {
    try {
      setError(null);
      await resumeService.togglePin(resumeId);

      // Update local state
      setResumes((prevResumes) =>
        prevResumes.map((r) =>
          r._id === resumeId
            ? { ...r, isPinned: !r.isPinned, pinnedAt: !r.isPinned ? new Date() : null }
            : r
        )
      );

      setSuccessMessage('Resume pin status updated!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Toggle pin error:', error);
      setError(error.response?.data?.message || 'Failed to toggle pin status');
    }
  };

  /**
   * Handle set default
   */
  const handleSetDefault = async (resumeId) => {
    try {
      setError(null);
      await resumeService.setDefault(resumeId);

      // Update local state
      const newDefaultResume = resumes.find((r) => r._id === resumeId);
      setDefaultResume(newDefaultResume);

      setResumes((prevResumes) =>
        prevResumes.map((r) => ({ ...r, isDefault: r._id === resumeId }))
      );

      setSuccessMessage('Default resume set successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Set default error:', error);
      setError(error.response?.data?.message || 'Failed to set default resume');
    }
  };

  /**
   * Handle remove default
   */
  const handleRemoveDefault = async () => {
    if (!defaultResume) return;

    try {
      setError(null);
      await resumeService.removeDefault(defaultResume._id);

      // Update local state
      setDefaultResume(null);
      setResumes((prevResumes) =>
        prevResumes.map((r) =>
          r._id === defaultResume._id ? { ...r, isDefault: false } : r
        )
      );

      setSuccessMessage('Default resume removed!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Remove default error:', error);
      setError(error.response?.data?.message || 'Failed to remove default resume');
    }
  };

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteClick = (resumeId, resumeName) => {
    setConfirmDialog({
      isOpen: true,
      resumeId,
      resumeName,
      isDeleting: false,
    });
  };

  /**
   * Handle view details
   */
  const handleViewDetails = (resumeId) => {
    navigate(`/resume/${resumeId}`);
  };

  /**
   * Confirm delete action
   */
  const handleConfirmDelete = async () => {
    const { resumeId, resumeName } = confirmDialog;

    setConfirmDialog((prev) => ({ ...prev, isDeleting: true }));

    try {
      await resumeService.deleteResume(resumeId);

      // Show success message
      setSuccessMessage(`${resumeName} deleted successfully!`);

      // Refresh dashboard
      await fetchDashboardData();

      // Close dialog
      setConfirmDialog({
        isOpen: false,
        resumeId: null,
        resumeName: '',
        isDeleting: false,
      });

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Delete error:', error);
      const errorMsg =
        error.response?.data?.message || 'Failed to delete resume. Please try again.';
      setError(errorMsg);

      setConfirmDialog({
        isOpen: false,
        resumeId: null,
        resumeName: '',
        isDeleting: false,
      });
    }
  };

  /**
   * Cancel delete action
   */
  const handleCancelDelete = () => {
    if (!confirmDialog.isDeleting) {
      setConfirmDialog({
        isOpen: false,
        resumeId: null,
        resumeName: '',
        isDeleting: false,
      });
    }
  };

  /**
   * Get filtered and sorted resumes for display
   */
  const getDisplayResumes = () => {
    // Sort: pinned first, then by date
    const sorted = [...resumes].sort((a, b) => {
      // Pinned items first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Return top 5 for recent section
    return sorted.slice(0, 5);
  };

  /**
   * Calculate stats
   */
  const stats = {
    total: resumes.length,
    completed: resumes.filter((r) => r.parsingStatus === 'completed').length,
    processing: resumes.filter((r) => r.parsingStatus === 'processing').length,
  };

  // Show loading skeleton
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Manage your resumes and get AI-powered insights to improve your job applications.
        </p>
      </div>

      {/* Notifications */}
      <NotificationBanner
        type="success"
        message={successMessage}
        onDismiss={() => setSuccessMessage(null)}
      />

      <NotificationBanner
        type="error"
        message={error}
        onDismiss={() => setError(null)}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Resumes */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Resumes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        {/* Ready for Analysis */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ready</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </Card>

        {/* Processing */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
              <svg
                className="h-6 w-6 text-yellow-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Section */}
      {showUploadSection && (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upload New Resume</h2>
            <Button
              variant="ghost"
              size="small"
              onClick={() => setShowUploadSection(false)}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <ResumeUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </Card>
      )}

      {/* Empty State - No Resumes */}
      {!isLoading && resumes.length === 0 && (
        <EmptyState
          icon="document"
          title="No resumes yet"
          description="Upload your first resume to get started with AI-powered analysis and recommendations."
          action={
            <Button variant="primary" onClick={() => setShowUploadSection(true)}>
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Your First Resume
            </Button>
          }
        />
      )}

      {/* Main Content - Has Resumes */}
      {!isLoading && resumes.length > 0 && (
        <>
          {/* Quick Action - Upload Button */}
          {!showUploadSection && (
            <div className="mb-8">
              <Button
                variant="primary"
                onClick={() => setShowUploadSection(true)}
                className="w-full sm:w-auto"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload New Resume
              </Button>
            </div>
          )}

          {/* Default Resume Card */}
          <div className="mb-8">
            <DefaultResumeCard
              resume={defaultResume}
              onRemoveDefault={handleRemoveDefault}
            />
          </div>

          {/* Recent Resumes */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {resumes.some((r) => r.isPinned) ? 'Pinned & Recent Resumes' : 'Recent Resumes'}
              </h2>
              {resumes.length > 5 && (
                <button
                  onClick={() => navigate('/resumes')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View All ({resumes.length}) →
                </button>
              )}
            </div>

            <div className="space-y-4">
              {getDisplayResumes().map((resume) => (
                <ResumeCard
                  key={resume._id}
                  resume={resume}
                  onDelete={handleDeleteClick}
                  onViewDetails={handleViewDetails}
                  onTogglePin={handleTogglePin}
                  onSetDefault={handleSetDefault}
                  isDeleting={false}
                />
              ))}
            </div>
          </div>

          {/* Recent Exports */}
          <div className="mb-8">
            <RecentExports
              exports={recentExports}
              onViewAll={() => navigate('/exports')}
            />
          </div>

          {/* Quick Links */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/analytics')}
                className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all text-left"
              >
                <div className="flex items-center mb-2">
                  <svg className="h-6 w-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Analytics</h3>
                </div>
                <p className="text-sm text-gray-600">View detailed analytics and trends</p>
              </button>

              <button
                onClick={() => navigate('/chat')}
                className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all text-left"
              >
                <div className="flex items-center mb-2">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Resume Chat</h3>
                </div>
                <p className="text-sm text-gray-600">Ask questions about your resume</p>
              </button>

              <button
                onClick={() => navigate('/career-assistant')}
                className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all text-left"
              >
                <div className="flex items-center mb-2">
                  <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Career Assistant</h3>
                </div>
                <p className="text-sm text-gray-600">Get AI-powered career guidance</p>
              </button>
            </div>
          </Card>
        </>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Resume"
        message={`Are you sure you want to delete "${confirmDialog.resumeName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={confirmDialog.isDeleting}
      />
    </div>
  );
};

export default DashboardEnhanced;
