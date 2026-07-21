/**
 * Job Match History Page
 * Display all previous resume-to-job comparisons
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobMatchHistory, getJobMatchById, deleteJobMatch } from '../services/jobMatchService';
import { MaterialIcon, LoadingSpinner } from '../components';
import MatchScoreCard from '../components/MatchScoreCard';
import MatchSection from '../components/MatchSection';
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
      return (
        <div className="flex items-center justify-center py-xl">
          <LoadingSpinner />
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xxl text-center">
          <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-lg mx-auto">
            <MaterialIcon className="text-[48px] text-outline">search_off</MaterialIcon>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">No Match History Found</h3>
          <p className="text-on-surface-variant font-body-base text-body-base max-w-md mx-auto mb-xl">
            You haven't run any job matches yet. Upload your resume and paste a job description to see how you stack up.
          </p>
          <button
            onClick={() => navigate('/job-match')}
            className="bg-primary text-on-primary px-lg py-md rounded-lg font-bold hover:bg-primary-container transition-all flex items-center gap-sm mx-auto"
          >
            <MaterialIcon>add_circle</MaterialIcon>
            Start New Match
          </button>
        </div>
      );
    }

    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-lg py-md font-label-caps text-label-caps text-on-surface-variant">Resume Name</th>
                <th className="px-lg py-md font-label-caps text-label-caps text-on-surface-variant">Job Title</th>
                <th className="px-lg py-md font-label-caps text-label-caps text-on-surface-variant">Company</th>
                <th className="px-lg py-md font-label-caps text-label-caps text-on-surface-variant">Match Score</th>
                <th className="px-lg py-md font-label-caps text-label-caps text-on-surface-variant">Status</th>
                <th className="px-lg py-md font-label-caps text-label-caps text-on-surface-variant">Date</th>
                <th className="px-lg py-md font-label-caps text-label-caps text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {matches.map((match) => {
                const radius = 15.9155;
                const circumference = 2 * Math.PI * radius;
                const score = match.matchScore || 0;
                const dashArray = `${(score / 100) * 100}, 100`;
                
                return (
                  <tr key={match._id} className="hover:bg-surface-bright transition-colors">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <MaterialIcon className="text-primary">description</MaterialIcon>
                        <span className="font-body-sm text-body-sm font-semibold">
                          {match.resume?.originalName || 'Unknown Resume'}
                        </span>
                      </div>
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm">
                      {match.jobDescription?.title || 'Unknown Job'}
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm">
                      {match.jobDescription?.company || '-'}
                    </td>
                    <td className="px-lg py-md">
                      {match.matchStatus === 'completed' ? (
                        <div className="flex items-center gap-sm">
                          <div className="w-10 h-10 relative">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="3"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={score >= 80 ? '#006e2d' : score >= 60 ? '#973400' : '#ba1a1a'}
                                strokeDasharray={dashArray}
                                strokeWidth="3"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                              {score}%
                            </span>
                          </div>
                          <span
                            className={`font-bold font-body-sm text-body-sm ${
                              score >= 80 ? 'text-secondary' : score >= 60 ? 'text-tertiary' : 'text-error'
                            }`}
                          >
                            {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Low'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-sm">
                          <div className="animate-pulse w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                            <MaterialIcon className="text-on-surface-variant text-sm">sync</MaterialIcon>
                          </div>
                          <span className="text-on-surface-variant italic font-body-sm text-body-sm">Calculating...</span>
                        </div>
                      )}
                    </td>
                    <td className="px-lg py-md">
                      <span
                        className={`px-sm py-xs rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          match.matchStatus === 'completed'
                            ? 'bg-[#e7f6ed] text-[#006e2d]'
                            : match.matchStatus === 'processing'
                            ? 'bg-[#f0f0fb] text-primary'
                            : match.matchStatus === 'failed'
                            ? 'bg-[#fff0f0] text-[#ba1a1a]'
                            : 'bg-[#f0f0fb] text-primary'
                        }`}
                      >
                        {match.matchStatus === 'processing' && (
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                        )}
                        {match.matchStatus}
                      </span>
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">
                      {new Date(match.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-lg py-md text-right">
                      <div className="flex justify-end gap-sm">
                        <button
                          onClick={() => handleMatchClick(match)}
                          className="p-2 hover:bg-surface-variant rounded-lg transition-colors text-primary"
                          title="View Report"
                        >
                          <MaterialIcon>visibility</MaterialIcon>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(match);
                          }}
                          className="p-2 hover:bg-error-container hover:text-on-error-container rounded-lg transition-colors text-on-surface-variant"
                          title="Delete"
                        >
                          <MaterialIcon>delete</MaterialIcon>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-lg py-md bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Showing <span className="font-bold">{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-bold">{pagination.total}</span> results
            </span>
            <div className="flex items-center gap-sm">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="p-2 border border-outline rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <MaterialIcon>chevron_left</MaterialIcon>
              </button>
              <div className="flex items-center">
                {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setPagination({ ...pagination, page })}
                      className={`w-10 h-10 rounded-lg font-bold ${
                        pagination.page === page
                          ? 'bg-primary text-on-primary'
                          : 'hover:bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="p-2 border border-outline rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <MaterialIcon>chevron_right</MaterialIcon>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render detail view
  const renderDetailView = () => {
    if (loadingMatch) {
      return (
        <div className="flex items-center justify-center py-xl">
          <LoadingSpinner />
        </div>
      );
    }

    if (!selectedMatch) {
      return null;
    }

    return (
      <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant">
        {/* Back Button */}
        <button
          onClick={() => setSelectedMatch(null)}
          className="mb-lg text-primary hover:text-primary-container font-bold flex items-center gap-sm transition-colors"
        >
          <MaterialIcon>arrow_back</MaterialIcon> Back to History
        </button>

        {/* Status Banner */}
        {selectedMatch.matchStatus !== 'completed' && (
          <div
            className={`mb-lg p-lg rounded-xl ${
              selectedMatch.matchStatus === 'failed'
                ? 'bg-error-container border border-error'
                : selectedMatch.matchStatus === 'processing'
                ? 'bg-primary-fixed border border-primary'
                : 'bg-surface-container-high border border-outline-variant'
            }`}
          >
            <p className="font-semibold font-body-base text-body-base">
              {selectedMatch.matchStatus === 'failed' && '❌ This comparison failed'}
              {selectedMatch.matchStatus === 'processing' && '⚙️ This comparison is still processing'}
              {selectedMatch.matchStatus === 'pending' && '⏳ This comparison is pending'}
            </p>
            {selectedMatch.errorMessage && (
              <p className="text-body-sm text-body-sm mt-sm text-error">{selectedMatch.errorMessage}</p>
            )}
          </div>
        )}

        {/* Only show results if completed */}
        {selectedMatch.matchStatus === 'completed' && (
          <>
            {/* Resume and Job Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xl">
              <div className="bg-primary-fixed border border-primary rounded-xl p-lg">
                <h3 className="font-semibold text-primary mb-sm font-headline-md text-headline-md">Resume</h3>
                <p className="text-on-primary-fixed-variant font-body-base text-body-base">
                  {selectedMatch.resume?.originalName}
                </p>
              </div>
              <div className="bg-secondary-fixed border border-secondary rounded-xl p-lg">
                <h3 className="font-semibold text-secondary mb-sm font-headline-md text-headline-md">Job Description</h3>
                <p className="text-on-secondary-fixed-variant font-body-base text-body-base">
                  {selectedMatch.jobDescription?.title}
                </p>
                {selectedMatch.jobDescription?.company && (
                  <p className="text-body-sm text-body-sm text-on-secondary-fixed-variant">
                    {selectedMatch.jobDescription.company}
                  </p>
                )}
              </div>
            </div>

            {/* Match Score Card */}
            <div className="mb-xl">
              <MatchScoreCard score={selectedMatch.matchScore} />
            </div>

            {/* Summary */}
            {selectedMatch.summary && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Summary</h3>
                <p className="text-on-surface-variant font-body-base text-body-base leading-relaxed">
                  {selectedMatch.summary}
                </p>
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
              <div className="mt-xl text-center text-body-sm text-body-sm text-on-surface-variant">
                <p>Analysis generated on {new Date(selectedMatch.generatedAt).toLocaleString()}</p>
                {selectedMatch.confidenceScore && (
                  <p className="mt-xs">Confidence Score: {selectedMatch.confidenceScore}%</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow w-full max-w-container-max mx-auto px-lg py-xl">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface mb-xs">Job Match History</h1>
            <p className="text-on-surface-variant font-body-base text-body-base">
              Review and manage your resume's compatibility with previous job applications.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-md">
            <div className="flex flex-col gap-xs">
              <span className="font-label-caps text-label-caps text-on-surface-variant px-1">Status</span>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="bg-surface border border-outline rounded-lg px-md py-sm font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <button
              onClick={() => navigate('/job-match')}
              className="bg-primary text-on-primary px-lg py-sm rounded-lg font-bold hover:bg-primary-container transition-all flex items-center gap-sm mt-auto"
            >
              <MaterialIcon>add_circle</MaterialIcon>
              New Match
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error-container border border-error text-on-error-container px-lg py-md rounded-xl mb-lg">
            <p className="font-body-base text-body-base">{error}</p>
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
          message="Are you sure you want to delete this comparison? This action cannot be undone."
          confirmText="Delete"
          confirmStyle="danger"
        />
      </main>
    </div>
  );
};

export default JobMatchHistory;
