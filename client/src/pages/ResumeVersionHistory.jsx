/**
 * Resume Version History Page
 * Displays all versions of a resume with comparison options
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, LoadingSpinner, EmptyState, NotificationBanner } from '../components';
import { resumeService } from '../services';

const ResumeVersionHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersions, setSelectedVersions] = useState([]);

  useEffect(() => {
    fetchVersionHistory();
  }, [id]);

  const fetchVersionHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch resume details
      const resumeResponse = await resumeService.getResumeParsedData(id);
      setResume(resumeResponse.data);

      // Fetch versions
      const versionsResponse = await resumeService.getResumeVersions(id, {
        limit: 50,
        includeData: false,
      });
      setVersions(versionsResponse.data?.versions || []);
    } catch (err) {
      console.error('Error fetching version history:', err);
      setError(err.response?.data?.message || 'Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionSelect = (versionNumber) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionNumber)) {
        return prev.filter((v) => v !== versionNumber);
      } else if (prev.length < 2) {
        return [...prev, versionNumber];
      } else {
        return [prev[1], versionNumber];
      }
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      const [v1, v2] = selectedVersions.sort((a, b) => a - b);
      navigate(`/resume/${id}/compare/${v1}/${v2}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVersionLabel = (version) => {
    if (version.versionNumber === 1) return 'Initial Upload';
    if (version.aiAnalysisCompleted) return 'AI Analysis Complete';
    return `Version ${version.versionNumber}`;
  };

  const getATSScoreBadge = (score) => {
    if (!score) return null;

    let colorClass = 'bg-red-100 text-red-800';
    if (score >= 80) colorClass = 'bg-green-100 text-green-800';
    else if (score >= 60) colorClass = 'bg-yellow-100 text-yellow-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        ATS: {score}
      </span>
    );
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading version history..." />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Version History</h1>
        {resume && (
          <p className="text-lg text-gray-600">{resume.originalName}</p>
        )}
      </div>

      {/* Error Notification */}
      <NotificationBanner
        type="error"
        message={error}
        onDismiss={() => setError(null)}
      />

      {/* Compare Button */}
      {selectedVersions.length === 2 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
          <p className="text-sm text-blue-900">
            <strong>{selectedVersions.length} versions selected</strong> - Ready to compare
          </p>
          <Button variant="primary" onClick={handleCompare}>
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Compare Versions
          </Button>
        </div>
      )}

      {/* Help Text */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <svg className="h-5 w-5 inline mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Select two versions to compare changes in ATS score, skills, experience, and more.
        </p>
      </div>

      {/* Empty State */}
      {versions.length === 0 && (
        <EmptyState
          icon="clock"
          title="No version history"
          description="Version history will appear here as you update and analyze your resume."
        />
      )}

      {/* Version List */}
      {versions.length > 0 && (
        <div className="space-y-4">
          {versions.map((version) => (
            <Card
              key={version._id}
              className={`transition-all ${
                selectedVersions.includes(version.versionNumber)
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Checkbox */}
                <div className="flex items-center space-x-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(version.versionNumber)}
                    onChange={() => handleVersionSelect(version.versionNumber)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    disabled={
                      !selectedVersions.includes(version.versionNumber) &&
                      selectedVersions.length >= 2
                    }
                  />

                  {/* Version Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getVersionLabel(version)}
                      </h3>
                      {version.versionNumber === versions.length && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Latest
                        </span>
                      )}
                      {getATSScoreBadge(version.atsScore)}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(version.createdAt)}
                      </span>

                      {version.wordCount > 0 && (
                        <span className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {version.wordCount} words
                        </span>
                      )}

                      {version.skillsCount > 0 && (
                        <span className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {version.skillsCount} skills
                        </span>
                      )}
                    </div>

                    {/* Changes Summary */}
                    {version.changesSummary && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{version.changesSummary}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/resume/${id}/version/${version.versionNumber}`)}
                    title="View this version"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResumeVersionHistory;
