/**
 * Resume Comparison Page
 * Compares two versions of a resume side by side
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, LoadingSpinner, NotificationBanner } from '../components';
import { resumeService } from '../services';

const ResumeComparison = () => {
  const { id, version1, version2 } = useParams();
  const navigate = useNavigate();

  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComparison();
  }, [id, version1, version2]);

  const fetchComparison = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await resumeService.compareVersions(
        id,
        parseInt(version1),
        parseInt(version2)
      );

      setComparison(response.data);
    } catch (err) {
      console.error('Error fetching comparison:', err);
      setError(err.response?.data?.message || 'Failed to load comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreDiff = (oldScore, newScore) => {
    const diff = newScore - oldScore;
    if (diff === 0) return null;

    const sign = diff > 0 ? '+' : '';
    const colorClass = diff > 0 ? 'text-green-600' : 'text-red-600';
    const icon = diff > 0 ? '↑' : '↓';

    return (
      <span className={`ml-2 text-sm font-medium ${colorClass}`}>
        {icon} {sign}{diff}
      </span>
    );
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

  if (isLoading) {
    return <LoadingSpinner text="Comparing versions..." />;
  }

  if (error || !comparison) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <NotificationBanner
          type="error"
          message={error || 'Comparison data not available'}
          onDismiss={() => navigate(`/resume/${id}/versions`)}
        />
        <div className="mt-4">
          <Button onClick={() => navigate(`/resume/${id}/versions`)}>
            Back to Version History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/resume/${id}/versions`)}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Version History
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Version Comparison</h1>
            <p className="text-lg text-gray-600">
              Comparing Version {version1} with Version {version2}
            </p>
          </div>
        </div>
      </div>

      {/* ATS Score Comparison */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">ATS Score</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Version 1 */}
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Version {version1}</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">
              {comparison.oldVersion?.atsScore || 'N/A'}
            </p>
            <p className="text-xs text-gray-500">
              {comparison.oldVersion?.createdAt && formatDate(comparison.oldVersion.createdAt)}
            </p>
          </div>

          {/* Version 2 */}
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-2">Version {version2}</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">
              {comparison.newVersion?.atsScore || 'N/A'}
              {comparison.scoreDiff && getScoreDiff(
                comparison.oldVersion?.atsScore || 0,
                comparison.newVersion?.atsScore || 0
              )}
            </p>
            <p className="text-xs text-gray-500">
              {comparison.newVersion?.createdAt && formatDate(comparison.newVersion.createdAt)}
            </p>
          </div>
        </div>

        {/* Score Difference */}
        {comparison.scoreDiff && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Score Change Analysis</p>
                <p className="text-sm text-blue-800">
                  {comparison.scoreDiff.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Skills Changes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Skills Added */}
        {comparison.skillsAdded && comparison.skillsAdded.length > 0 && (
          <Card>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-2 mr-3">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Skills Added</h2>
                <p className="text-sm text-gray-600">{comparison.skillsAdded.length} new skills</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {comparison.skillsAdded.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Skills Removed */}
        {comparison.skillsRemoved && comparison.skillsRemoved.length > 0 && (
          <Card>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 bg-red-100 rounded-lg p-2 mr-3">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Skills Removed</h2>
                <p className="text-sm text-gray-600">{comparison.skillsRemoved.length} skills removed</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {comparison.skillsRemoved.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Experience Changes */}
      {comparison.experienceChanges && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Experience Changes</h2>
          <div className="space-y-4">
            {comparison.experienceChanges.added && comparison.experienceChanges.added.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Added ({comparison.experienceChanges.added.length})
                </h3>
                <div className="space-y-2">
                  {comparison.experienceChanges.added.map((exp, index) => (
                    <div key={index} className="pl-5 p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-gray-900">{exp.title || 'Position'}</p>
                      {exp.company && (
                        <p className="text-sm text-gray-600">{exp.company}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comparison.experienceChanges.removed && comparison.experienceChanges.removed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  Removed ({comparison.experienceChanges.removed.length})
                </h3>
                <div className="space-y-2">
                  {comparison.experienceChanges.removed.map((exp, index) => (
                    <div key={index} className="pl-5 p-3 bg-red-50 rounded-lg">
                      <p className="font-medium text-gray-900">{exp.title || 'Position'}</p>
                      {exp.company && (
                        <p className="text-sm text-gray-600">{exp.company}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Education Changes */}
      {comparison.educationChanges && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Education Changes</h2>
          <div className="space-y-4">
            {comparison.educationChanges.added && comparison.educationChanges.added.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Added ({comparison.educationChanges.added.length})
                </h3>
                <div className="space-y-2">
                  {comparison.educationChanges.added.map((edu, index) => (
                    <div key={index} className="pl-5 p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-gray-900">{edu.degree || 'Degree'}</p>
                      {edu.institution && (
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comparison.educationChanges.removed && comparison.educationChanges.removed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  Removed ({comparison.educationChanges.removed.length})
                </h3>
                <div className="space-y-2">
                  {comparison.educationChanges.removed.map((edu, index) => (
                    <div key={index} className="pl-5 p-3 bg-red-50 rounded-lg">
                      <p className="font-medium text-gray-900">{edu.degree || 'Degree'}</p>
                      {edu.institution && (
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* AI Summary */}
      {comparison.aiSummary && (
        <Card>
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3 mr-4">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">AI-Generated Summary</h2>
              <p className="text-gray-700 leading-relaxed">{comparison.aiSummary}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResumeComparison;
