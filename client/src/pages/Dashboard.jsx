import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui';
import { ResumeUpload } from '../components/ResumeUpload';
import { ResumeList } from '../components/ResumeList';
import { resumeService } from '../services';

const Dashboard = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(true);

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
      const response = await resumeService.uploadResume(file);
      
      // Show success message
      setSuccessMessage(`${file.name} uploaded successfully!`);
      
      // Refresh resumes list
      await fetchResumes();
      
      // Hide upload section after first upload
      if (resumes.length === 0) {
        setShowUploadSection(false);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to upload resume. Please try again.';
      setError(errorMessage);
      throw err; // Re-throw to let ResumeUpload handle loading state
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
   * Handle delete resume
   */
  const handleDeleteResume = async (resumeId) => {
    try {
      setError(null);
      await resumeService.deleteResume(resumeId);
      
      // Show success message
      setSuccessMessage('Resume deleted successfully!');
      
      // Refresh resumes list
      await fetchResumes();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete resume. Please try again.';
      setError(errorMessage);
    }
  };

  /**
   * Toggle upload section
   */
  const toggleUploadSection = () => {
    setShowUploadSection(!showUploadSection);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Manage your resumes and get AI-powered insights to improve your job applications.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Section */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {showUploadSection ? 'Upload New Resume' : 'Upload Resume'}
          </h2>
          {resumes.length > 0 && (
            <button
              onClick={toggleUploadSection}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {showUploadSection ? 'Hide' : 'Show'}
            </button>
          )}
        </div>

        {showUploadSection && (
          <ResumeUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        )}
      </Card>

      {/* Resumes List Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Resumes {!isLoading && resumes.length > 0 && `(${resumes.length})`}
          </h2>
          {resumes.length > 0 && !showUploadSection && (
            <button
              onClick={toggleUploadSection}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload New
            </button>
          )}
        </div>

        <ResumeList
          resumes={resumes}
          onDelete={handleDeleteResume}
          isLoading={isLoading}
        />
      </div>

      {/* Coming Soon Features */}
      {resumes.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Coming Soon
          </h2>
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
              <p className="text-sm text-gray-600">
                Ask questions about your resume and get instant answers
              </p>
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
    </div>
  );
};

export default Dashboard;
