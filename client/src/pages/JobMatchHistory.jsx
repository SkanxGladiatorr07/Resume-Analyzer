/**
 * Job Match History Page
 * Display all previous resume-to-job comparisons
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobMatchHistory, getJobMatchById, deleteJobMatch } from '../services/jobMatchService';
import MatchScoreCard from '../components/MatchScoreCard';
import MatchSection from '../components/MatchSection';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const JobMatchHistory = () => {
  const navigate = useNavigate();

  // State
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Confirm dialog
  const [showConfirm, setShowConfirm] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState(null);

  // Fetch matches on mount and when filters change
  useEffect(() => {
    fetchMatches();
  }, [filterStatus, pagination.page]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await getJobMatchHistory(params);
      setMatches(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load job match history. Please try again.');
      console.error('Error fetching job match history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchClick = async (match) => {
    try {
      setLoadingMatch(true);
      setError(null);

      // Fetch full match details
      const response = await getJobMatchById(match._id);
      setSelectedMatch(response.data.data);
    } catch (err) {
      setError('Failed to load match details. Please try again.');
      console.error('Error fetching match details:', err);
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleDeleteClick = (match) => {
    setMatchToDelete(match);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!matchToDelete) return;

    try {
      setError(null);
      await deleteJobMatch(matchToDelete.resume._id, matchToDelete.jobDescription._id);
      
      // Remove from list
      setMatches(matches.filter(m => m._id !== matchToDelete._id));
      
      // Close detail view if it's the deleted match
      if (selectedMatch && selectedMatch._id === matchToDelete._id) {
        setSelectedMatch(null);
      }

      setShowConfirm(false);
      setMatchToDelete(null);
    } catch (err) {
      setError('Failed to delete job match. Please try again.');
      console.error('Error deleting job match:', err);
      setShowConfirm(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };

    return badges[status] || badges.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      processing: '⚙️',
      completed: '✅',
      failed: '❌',
    };

    return icons[status] || '⏳';
  };

  // Render list view
  const renderListView = () => {
    if (loading) {
      return <LoadingSpinner message="Loading comparison history..." />;
    }

    if (matches.length === 0) {
      return (
        <EmptyState
          icon="📊"
          title="No Comparisons Yet"
          message="Start comparing your resumes with job descriptions to see them here."
          actionText="Start New Comparison"
          onAction={() => navigate('/job-match')}
        />
      );
    }

    return (
      <div className="space-y-4">
        {matches.map((match) => (
          <div
            key={match._id}
            className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => handleMatchClick(match)}>
                {/* Status and Score */}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(match.matchStatus)}`}>
                    {getStatusIcon(match.matchStatus)} {match.matchStatus}
                  </span>
                  {match.matchStatus === 'completed' && match.matchScore !== null && (
                    <span className="text-2xl font-bold text-blue-600">
                      {match.matchScore}%
                    </span>
                  )}
                </div>

                {/* Resume and Job Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Resume</p>
                    <p className="font-semibold text-gray-900">
                      {match.resume?.originalName || 'Unknown Resume'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Job Description</p>
                    <p className="font-semibold text-gray-900">
                      {match.jobDescription?.title || 'Unknown Job'}
                    </p>
                    {match.jobDescription?.company && (
                      <p className="text-sm text-gray-600">{match.jobDescription.company}</p>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Created: {new Date(match.createdAt).toLocaleDateString()}</span>
                  {match.generatedAt && (
                    <span>Generated: {new Date(match.generatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleMatchClick(match)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(match);
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={match.matchStatus === 'processing'}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render detail view
  const renderDetailView = () => {
    if (loadingMatch) {
      return <LoadingSpinner message="Loading match details..." />;
    }

    if (!selectedMatch) {
      return null;
    }

    return (
      <div className="bg-white rounded-lg p-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedMatch(null)}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          ← Back to History
        </button>

        {/* Status Banner */}
        {selectedMatch.matchStatus !== 'completed' && (
          <div className={`mb-6 p-4 rounded-lg ${
            selectedMatch.matchStatus === 'failed' ? 'bg-red-50 border border-red-200' :
            selectedMatch.matchStatus === 'processing' ? 'bg-blue-50 border border-blue-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <p className="font-semibold">
              {selectedMatch.matchStatus === 'failed' && '❌ This comparison failed'}
              {selectedMatch.matchStatus === 'processing' && '⚙️ This comparison is still processing'}
              {selectedMatch.matchStatus === 'pending' && '⏳ This comparison is pending'}
            </p>
            {selectedMatch.errorMessage && (
              <p className="text-sm mt-1 text-red-700">{selectedMatch.errorMessage}</p>
            )}
          </div>
        )}

        {/* Only show results if completed */}
        {selectedMatch.matchStatus === 'completed' && (
          <>
            {/* Resume and Job Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-1">Resume</h3>
                <p className="text-blue-700">{selectedMatch.resume?.originalName}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-1">Job Description</h3>
                <p className="text-purple-700">{selectedMatch.jobDescription?.title}</p>
                {selectedMatch.jobDescription?.company && (
                  <p className="text-sm text-purple-600">{selectedMatch.jobDescription.company}</p>
                )}
              </div>
            </div>

            {/* Match Score Card */}
            <div className="mb-8">
              <MatchScoreCard score={selectedMatch.matchScore} />
            </div>

            {/* Summary */}
            {selectedMatch.summary && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
                <p className="text-gray-700 leading-relaxed">{selectedMatch.summary}</p>
              </div>
            )}

            {/* All Match Sections */}
            <MatchSection
              title="Matching Skills"
              items={selectedMatch.matchingSkills}
              emptyMessage="No matching skills identified"
              icon="✓"
              colorClass="text-green-600"
            />

            <MatchSection
              title="Missing Technical Skills"
              items={selectedMatch.missingTechnicalSkills}
              emptyMessage="No missing technical skills"
              icon="⚙️"
              colorClass="text-orange-600"
            />

            <MatchSection
              title="Missing Soft Skills"
              items={selectedMatch.missingSoftSkills}
              emptyMessage="No missing soft skills"
              icon="💡"
              colorClass="text-purple-600"
            />

            <MatchSection
              title="Missing Keywords"
              items={selectedMatch.missingKeywords}
              emptyMessage="No missing keywords"
              icon="🔑"
              colorClass="text-blue-600"
            />

            <MatchSection
              title="Your Strengths"
              items={selectedMatch.strengths}
              emptyMessage="No strengths identified"
              icon="⭐"
              colorClass="text-yellow-600"
            />

            <MatchSection
              title="AI Recommendations"
              items={selectedMatch.recommendations}
              emptyMessage="No recommendations"
              icon="💬"
              colorClass="text-indigo-600"
            />

            <MatchSection
              title="ATS Optimization Tips"
              items={selectedMatch.atsOptimizationTips}
              emptyMessage="No ATS tips"
              icon="🎯"
              colorClass="text-red-600"
            />

            {/* Metadata */}
            {selectedMatch.generatedAt && (
              <div className="mt-8 text-center text-sm text-gray-500">
                <p>Analysis generated on {new Date(selectedMatch.generatedAt).toLocaleString()}</p>
                {selectedMatch.confidenceScore && (
                  <p className="mt-1">Confidence Score: {selectedMatch.confidenceScore}%</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comparison History</h1>
          <p className="text-gray-600">
            View all your previous resume-to-job comparisons
          </p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* New Comparison Button */}
          <button
            onClick={() => navigate('/job-match')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Comparison
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Content */}
        {selectedMatch ? renderDetailView() : renderListView()}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => {
            setShowConfirm(false);
            setMatchToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Comparison"
          message={`Are you sure you want to delete this comparison? This action cannot be undone.`}
          confirmText="Delete"
          confirmStyle="danger"
        />
      </div>
    </div>
  );
};

export default JobMatchHistory;
