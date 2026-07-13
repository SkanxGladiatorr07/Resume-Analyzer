/**
 * JobMatch Page
 * Allows users to compare their resume with a job description
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResumes } from '../services/resumeService';
import { getJobDescriptions, createJobDescription } from '../services/jobDescriptionService';
import {
  generateJobMatch,
  getJobMatch,
  pollJobMatchStatus,
} from '../services/jobMatchService';
import MatchScoreCard from '../components/MatchScoreCard';
import MatchSection from '../components/MatchSection';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const JobMatch = () => {
  const navigate = useNavigate();

  // Step management
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Resume, 2: Select/Create Job, 3: Results

  // Data states
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedJobDescription, setSelectedJobDescription] = useState(null);
  const [matchResults, setMatchResults] = useState(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // New job description form
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCompany, setNewJobCompany] = useState('');
  const [newJobDescription, setNewJobDescription] = useState('');

  // Fetch resumes on mount
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoadingResumes(true);
      const response = await getResumes();
      // Filter only completed resumes
      const completedResumes = response.data.data.filter(
        (resume) => resume.parsingStatus === 'completed'
      );
      setResumes(completedResumes);
      setError(null);
    } catch (err) {
      setError('Failed to load resumes. Please try again.');
      console.error('Error fetching resumes:', err);
    } finally {
      setLoadingResumes(false);
    }
  };

  const fetchJobDescriptions = async () => {
    try {
      setLoadingJobs(true);
      const response = await getJobDescriptions();
      setJobDescriptions(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load job descriptions. Please try again.');
      console.error('Error fetching job descriptions:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleResumeSelect = (resume) => {
    setSelectedResume(resume);
    setCurrentStep(2);
    fetchJobDescriptions();
  };

  const handleJobDescriptionSelect = (job) => {
    setSelectedJobDescription(job);
    startJobMatch(selectedResume._id, job._id);
  };

  const handleCreateNewJob = async () => {
    if (!newJobTitle || !newJobDescription) {
      setError('Please fill in title and description (minimum 100 characters)');
      return;
    }

    if (newJobDescription.trim().length < 100) {
      setError('Job description must be at least 100 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await createJobDescription({
        title: newJobTitle,
        company: newJobCompany,
        description: newJobDescription,
      });

      const newJob = response.data.data;
      setJobDescriptions([newJob, ...jobDescriptions]);
      setSelectedJobDescription(newJob);
      setShowNewJobForm(false);

      // Reset form
      setNewJobTitle('');
      setNewJobCompany('');
      setNewJobDescription('');

      // Start job match
      startJobMatch(selectedResume._id, newJob._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job description');
      console.error('Error creating job description:', err);
    } finally {
      setLoading(false);
    }
  };

  const startJobMatch = async (resumeId, jobDescriptionId) => {
    try {
      setGenerating(true);
      setCurrentStep(3);
      setError(null);
      setStatusMessage('Starting AI comparison...');

      // Generate match
      const response = await generateJobMatch(resumeId, jobDescriptionId);

      if (response.data.status === 'completed') {
        // Already completed (cached)
        setMatchResults(response.data.data);
        setStatusMessage('');
      } else if (response.data.status === 'processing') {
        // Poll for completion
        setStatusMessage('AI is analyzing the match... (this may take 10-20 seconds)');

        await pollJobMatchStatus(
          resumeId,
          jobDescriptionId,
          (statusData) => {
            if (statusData.status === 'processing') {
              setStatusMessage('AI is analyzing the match... please wait');
            }
          },
          2000
        );

        // Fetch final results
        const resultsResponse = await getJobMatch(resumeId, jobDescriptionId);
        setMatchResults(resultsResponse.data.data);
        setStatusMessage('');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate job match');
      console.error('Error generating job match:', err);
      setStatusMessage('');
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedResume(null);
    setSelectedJobDescription(null);
    setMatchResults(null);
    setError(null);
    setStatusMessage('');
  };

  const handleRegenerate = () => {
    if (selectedResume && selectedJobDescription) {
      startJobMatch(selectedResume._id, selectedJobDescription._id);
    }
  };

  // Step 1: Select Resume
  const renderResumeSelection = () => {
    if (loadingResumes) {
      return <LoadingSpinner message="Loading your resumes..." />;
    }

    if (resumes.length === 0) {
      return (
        <EmptyState
          icon="📄"
          title="No Resumes Available"
          message="Please upload and parse a resume first before matching with job descriptions."
          actionText="Go to Upload"
          onAction={() => navigate('/upload')}
        />
      );
    }

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Resume</h2>
        <p className="text-gray-600 mb-6">Choose which resume you want to match with a job description</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <div
              key={resume._id}
              onClick={() => handleResumeSelect(resume)}
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">📄</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{resume.originalName}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                      Parsed
                    </span>
                    <span>{(resume.fileSize / 1024).toFixed(0)} KB</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Step 2: Select or Create Job Description
  const renderJobSelection = () => {
    return (
      <div>
        <button
          onClick={handleReset}
          className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          ← Back to Resume Selection
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-1">Selected Resume</h3>
          <p className="text-blue-700">{selectedResume?.originalName}</p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select or Create Job Description</h2>
        <p className="text-gray-600 mb-6">Choose an existing job description or create a new one</p>

        {/* Create New Button */}
        <button
          onClick={() => setShowNewJobForm(!showNewJobForm)}
          className="mb-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"
        >
          {showNewJobForm ? '✕ Cancel' : '+ Create New Job Description'}
        </button>

        {/* New Job Form */}
        {showNewJobForm && (
          <div className="bg-white border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Job Description</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  value={newJobCompany}
                  onChange={(e) => setNewJobCompany(e.target.value)}
                  placeholder="e.g., Tech Corp"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description * (minimum 100 characters)
                </label>
                <textarea
                  value={newJobDescription}
                  onChange={(e) => setNewJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {newJobDescription.trim().length} / 100 characters minimum
                </p>
              </div>

              <button
                onClick={handleCreateNewJob}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create and Match'}
              </button>
            </div>
          </div>
        )}

        {/* Existing Job Descriptions */}
        {loadingJobs ? (
          <LoadingSpinner message="Loading job descriptions..." />
        ) : jobDescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No existing job descriptions. Create one above to get started.</p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Choose Existing:</h3>
            <div className="grid grid-cols-1 gap-4">
              {jobDescriptions.map((job) => (
                <div
                  key={job._id}
                  onClick={() => handleJobDescriptionSelect(job)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">💼</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                      {job.company && (
                        <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                      )}
                      <p className="text-sm text-gray-500 line-clamp-2">{job.preview}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Created {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step 3: Match Results
  const renderMatchResults = () => {
    if (generating || !matchResults) {
      return (
        <div className="text-center py-12">
          <LoadingSpinner message={statusMessage} />
          <p className="text-gray-600 mt-4">
            Our AI is analyzing your resume against the job description...
          </p>
          <p className="text-sm text-gray-500 mt-2">This usually takes 10-20 seconds</p>
        </div>
      );
    }

    return (
      <div>
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            ← Start New Match
          </button>
          <button
            onClick={handleRegenerate}
            className="text-gray-600 hover:text-gray-700 flex items-center gap-1"
          >
            🔄 Regenerate Match
          </button>
        </div>

        {/* Selected Items Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-1">Resume</h3>
            <p className="text-blue-700">{selectedResume?.originalName}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-1">Job Description</h3>
            <p className="text-purple-700">{selectedJobDescription?.title}</p>
            {selectedJobDescription?.company && (
              <p className="text-sm text-purple-600">{selectedJobDescription.company}</p>
            )}
          </div>
        </div>

        {/* Match Score Card */}
        <div className="mb-8">
          <MatchScoreCard score={matchResults.matchScore} />
        </div>

        {/* Summary */}
        {matchResults.summary && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
            <p className="text-gray-700 leading-relaxed">{matchResults.summary}</p>
          </div>
        )}

        {/* Matching Skills */}
        <MatchSection
          title="Matching Skills"
          items={matchResults.matchingSkills}
          emptyMessage="No matching skills identified"
          icon="✓"
          colorClass="text-green-600"
        />

        {/* Missing Technical Skills */}
        <MatchSection
          title="Missing Technical Skills"
          items={matchResults.missingTechnicalSkills}
          emptyMessage="No missing technical skills"
          icon="⚙️"
          colorClass="text-orange-600"
        />

        {/* Missing Soft Skills */}
        <MatchSection
          title="Missing Soft Skills"
          items={matchResults.missingSoftSkills}
          emptyMessage="No missing soft skills"
          icon="💡"
          colorClass="text-purple-600"
        />

        {/* Missing Keywords */}
        <MatchSection
          title="Missing Keywords"
          items={matchResults.missingKeywords}
          emptyMessage="No missing keywords"
          icon="🔑"
          colorClass="text-blue-600"
        />

        {/* Strengths */}
        <MatchSection
          title="Your Strengths"
          items={matchResults.strengths}
          emptyMessage="No strengths identified"
          icon="⭐"
          colorClass="text-yellow-600"
        />

        {/* Recommendations */}
        <MatchSection
          title="AI Recommendations"
          items={matchResults.recommendations}
          emptyMessage="No recommendations"
          icon="💬"
          colorClass="text-indigo-600"
        />

        {/* ATS Optimization Tips */}
        <MatchSection
          title="ATS Optimization Tips"
          items={matchResults.atsOptimizationTips}
          emptyMessage="No ATS tips"
          icon="🎯"
          colorClass="text-red-600"
        />

        {/* Metadata */}
        {matchResults.generatedAt && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Analysis generated on {new Date(matchResults.generatedAt).toLocaleString()}</p>
            {matchResults.confidenceScore && (
              <p className="mt-1">Confidence Score: {matchResults.confidenceScore}%</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Match</h1>
          <p className="text-gray-600">
            Compare your resume with a job description to see how well you match
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && renderResumeSelection()}
        {currentStep === 2 && renderJobSelection()}
        {currentStep === 3 && renderMatchResults()}
      </div>
    </div>
  );
};

export default JobMatch;
