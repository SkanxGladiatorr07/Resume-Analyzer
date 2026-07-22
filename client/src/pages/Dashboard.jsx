/**
 * Dashboard Page
 * Main dashboard for authenticated users showing resume management
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
  LoadingSpinner,
  NotificationBanner,
  ConfirmDialog,
} from '../components';
import { resumeService } from '../services';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [resumes, setResumes] = useState([]);
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
   * Fetch resumes on component mount
   */
  useEffect(() => {
    fetchResumes();
  }, []);

  /**
   * Fetch all resumes for the user
   */
  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await resumeService.getResumes();
      setResumes(response.data || []);
    } catch (err) {
      console.error('Error fetching resumes:', err);
      setError('Failed to load resumes. Please try again.');
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

      // Refresh resumes list
      await fetchResumes();

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
      throw error; // Re-throw to let ResumeUpload handle loading state
    }
  };

  /**
   * Handle upload error
   */
  const handleUploadError = (errorMessage) => {
    setError(errorMessage);
    // Clear error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
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

      // Refresh resumes list
      await fetchResumes();

      // Close dialog
      setConfirmDialog({
        isOpen: false,
        resumeId: null,
        resumeName: '',
        isDeleting: false,
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Delete error:', error);
      const errorMsg =
        error.response?.data?.message || 'Failed to delete resume. Please try again.';
      setError(errorMsg);

      // Close dialog even on error
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
   * Get recent resumes (last 3)
   */
  const recentResumes = resumes.slice(0, 3);

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
      {!isLoading && (
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
                <p className="text-2xl font-bold text-gray-900">{resumes.length}</p>
              </div>
            </div>
          </Card>

          {/* Upload Resume Card */}
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Quick Actions</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowUploadSection(!showUploadSection)}
                  className="mt-1"
                >
                  {showUploadSection ? 'Hide Upload' : 'Upload Resume'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Coming Soon */}
          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Analysis</p>
                <p className="text-xs text-gray-500 mt-1">Coming Soon</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Upload Section */}
      {showUploadSection && (
        <Card className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upload New Resume</h2>
          </div>
          <ResumeUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </Card>
      )}

      {/* Loading State */}
      {isLoading && <LoadingSpinner text="Loading your resumes..." />}

      {/* Empty State */}
      {!isLoading && resumes.length === 0 && (
        <EmptyState
          icon="document"
          title="No resumes yet"
          description="Upload your first resume to get started with AI-powered analysis and recommendations."
          action={
            <Button
              variant="primary"
              onClick={() => setShowUploadSection(true)}
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Your First Resume
            </Button>
          }
        />
      )}

      {/* Recent Resumes */}
      {!isLoading && resumes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Resumes</h2>
            {resumes.length > 3 && (
              <button
                onClick={() => navigate('/upload')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All →
              </button>
            )}
          </div>

          <div className="space-y-4">
            {recentResumes.map((resume) => (
              <ResumeCard
                key={resume._id}
                resume={resume}
                onDelete={handleDeleteClick}
                onViewDetails={handleViewDetails}
                isDeleting={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon Features */}
      {!isLoading && resumes.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600">
                Get intelligent feedback and ATS compatibility scores
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-gray-900 mb-2">Resume Chat</h3>
              <p className="text-sm text-gray-600 mb-3">
                Ask questions about your resume and get instant answers
              </p>
              <button
                onClick={() => navigate('/chat')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
              >
                Start Chat
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-2">Job Matching</h3>
              <p className="text-sm text-gray-600">
                Compare your resume against job descriptions
              </p>
            </div>
          </div>
        </Card>
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

export default Dashboard;
