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
import { MaterialIcon, LoadingSpinner } from '../components';
import MatchScoreCard from '../components/MatchScoreCard';
import MatchSection from '../components/MatchSection';

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

  const startJobMatch = async (resumeId, jobDescriptionId, force = false) => {
    try {
      setGenerating(true);
      setCurrentStep(3);
      setError(null);
      setStatusMessage('Starting AI comparison...');

      // Generate match
      const response = await generateJobMatch(resumeId, jobDescriptionId, force);

      if (response.data.status === 'completed') {
        // Already completed (cached)
        setMatchResults(response.data.data);
        setStatusMessage('');
        
        // Show cached indicator
        if (response.data.cached && !force) {
          setError(null);
          setStatusMessage('Using cached results. Click "Regenerate" for fresh analysis.');
          setTimeout(() => setStatusMessage(''), 3000);
        }
      } else if (response.data.status === 'processing') {
        // Poll for completion
        setStatusMessage('AI is analyzing the match... (this may take 10-20 seconds)');

        try {
          await pollJobMatchStatus(
            resumeId,
            jobDescriptionId,
            (statusData, attempts) => {
              if (statusData.status === 'processing') {
                setStatusMessage(`AI is analyzing the match... (${attempts * 2}s elapsed)`);
              }
            },
            2000,
            60 // 2 minutes max
          );

          // Fetch final results
          const resultsResponse = await getJobMatch(resumeId, jobDescriptionId);
          setMatchResults(resultsResponse.data.data);
          setStatusMessage('');
        } catch (pollError) {
          if (pollError.message.includes('timeout')) {
            setError('The comparison is taking longer than expected. Please check History page later.');
          } else {
            throw pollError;
          }
        }
      }
    } catch (err) {
      let errorMessage = 'Failed to generate job match. Please try again.';
      
      if (err.response?.status === 409) {
        errorMessage = 'A comparison is already in progress. Please wait for it to complete.';
      } else if (err.response?.status === 503) {
        errorMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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

  const handleRegenerate = async () => {
    if (selectedResume && selectedJobDescription) {
      // Force regeneration
      await startJobMatch(selectedResume._id, selectedJobDescription._id, true);
    }
  };

  // Step 1: Select Resume
  const renderResumeSelection = () => {
    if (loadingResumes) {
      return (
        <div className="flex items-center justify-center py-xl">
          <LoadingSpinner />
        </div>
      );
    }

    if (resumes.length === 0) {
      return (
        <div className="text-center py-xl">
          <MaterialIcon className="text-[64px] text-on-surface-variant mb-md">description</MaterialIcon>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md">No Resumes Available</h3>
          <p className="font-body-base text-body-base text-on-surface-variant mb-xl">
            Please upload and parse a resume first before matching with job descriptions.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-primary hover:bg-primary-container text-on-primary px-xl py-md rounded-lg font-bold transition-all active:scale-95 inline-flex items-center gap-sm"
          >
            <MaterialIcon className="text-sm">upload</MaterialIcon>
            Go to Upload
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        {resumes.map((resume) => (
          <label key={resume._id} className="relative cursor-pointer group">
            <input
              type="radio"
              name="resume-select"
              className="peer sr-only"
              checked={selectedResume?._id === resume._id}
              onChange={() => {}}
            />
            <div
              onClick={() => setSelectedResume(resume)}
              className="p-lg rounded-xl bg-surface-container-lowest border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary-fixed hover:shadow-md transition-all h-full flex flex-col"
            >
              <div className="flex justify-between items-start mb-md">
                <MaterialIcon className="text-primary text-4xl">description</MaterialIcon>
                <span className="bg-secondary-container text-on-secondary-container px-sm py-xs rounded-lg text-label-caps font-label-caps">
                  PARSED
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-xs">{resume.originalName}</h3>
              <p className="text-body-sm text-body-sm text-on-surface-variant flex-1">
                Updated {new Date(resume.createdAt).toLocaleDateString()} • {resume.fileType?.toUpperCase()}
              </p>
              {selectedResume?._id === resume._id && (
                <div className="mt-md pt-md border-t border-outline-variant flex items-center gap-xs text-primary font-bold">
                  <MaterialIcon style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</MaterialIcon>
                  <span className="text-label-caps font-label-caps">SELECTED</span>
                </div>
              )}
            </div>
          </label>
        ))}

        {/* Upload New Resume Card */}
        <button
          onClick={() => navigate('/upload')}
          className="p-lg rounded-xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-surface-container-low transition-all h-full flex flex-col items-center justify-center group"
        >
          <div className="w-12 h-12 rounded-full bg-surface-container-highest group-hover:bg-primary-fixed flex items-center justify-center mb-md transition-colors">
            <MaterialIcon className="text-on-surface-variant group-hover:text-primary">add</MaterialIcon>
          </div>
          <span className="font-headline-md text-headline-md">Upload New</span>
          <span className="text-body-sm text-body-sm text-on-surface-variant">Max 5MB (PDF, DOCX)</span>
        </button>
      </div>
    );
  };

  // Step 2: Select or Create Job Description
  const renderJobSelection = () => {
    return (
      <div>
        <div className="max-w-3xl mx-auto bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-outline-variant">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-lg">
            <div className="flex flex-col gap-xs">
              <label className="font-body-sm text-body-sm text-on-surface-variant">Job Title</label>
              <input
                type="text"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full bg-surface border border-outline-variant rounded-lg p-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-body-sm text-body-sm text-on-surface-variant">Company Name</label>
              <input
                type="text"
                value={newJobCompany}
                onChange={(e) => setNewJobCompany(e.target.value)}
                placeholder="e.g. TechFlow Inc."
                className="w-full bg-surface border border-outline-variant rounded-lg p-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-xs mb-md">
            <label className="font-body-sm text-body-sm text-on-surface-variant">Job Description</label>
            <div className="relative">
              <textarea
                value={newJobDescription}
                onChange={(e) => setNewJobDescription(e.target.value)}
                rows={10}
                placeholder="Paste the full job description here (responsibilities, requirements, benefits)..."
                className="w-full bg-surface border border-outline-variant rounded-lg p-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
              />
              <div className="absolute bottom-md right-md bg-surface-container-highest px-sm py-xs rounded text-label-caps font-label-caps text-on-surface-variant">
                <span className={newJobDescription.trim().length >= 100 ? 'text-secondary' : ''}>
                  {newJobDescription.trim().length}
                </span>{' '}
                / 100 min
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-xl flex-wrap gap-md">
            <button
              onClick={() => setCurrentStep(1)}
              className="text-on-surface-variant hover:text-primary font-bold flex items-center gap-sm transition-colors"
            >
              <MaterialIcon>arrow_back</MaterialIcon> Back to Resume
            </button>
            <button
              onClick={handleCreateNewJob}
              disabled={loading || newJobDescription.trim().length < 100 || !newJobTitle}
              className="bg-primary text-on-primary px-xl py-md rounded-lg font-bold hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-sm"
            >
              {loading ? 'Analyzing...' : 'Analyze Match'} <MaterialIcon>insights</MaterialIcon>
            </button>
          </div>
        </div>

        {/* Existing Job Descriptions */}
        {loadingJobs ? (
          <div className="flex items-center justify-center py-xl mt-xl">
            <LoadingSpinner />
          </div>
        ) : jobDescriptions.length > 0 ? (
          <div className="max-w-3xl mx-auto mt-xl">
            <div className="flex items-center justify-center mb-lg">
              <div className="h-px bg-outline-variant flex-1"></div>
              <span className="px-md text-on-surface-variant font-body-sm text-body-sm">OR SELECT EXISTING</span>
              <div className="h-px bg-outline-variant flex-1"></div>
            </div>

            <div className="grid grid-cols-1 gap-md">
              {jobDescriptions.slice(0, 3).map((job) => (
                <div
                  key={job._id}
                  onClick={() => handleJobDescriptionSelect(job)}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg hover:border-primary hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="flex items-start gap-md">
                    <MaterialIcon className="text-primary text-3xl">work</MaterialIcon>
                    <div className="flex-1">
                      <h3 className="font-headline-md text-headline-md group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      {job.company && (
                        <p className="text-body-sm text-body-sm text-on-surface-variant mb-sm">{job.company}</p>
                      )}
                      <p className="text-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                        {job.preview || job.description?.substring(0, 150)}...
                      </p>
                      <p className="font-label-caps text-label-caps text-on-surface-variant mt-sm">
                        Created {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  // Step 3: Match Results
  const renderMatchResults = () => {
    if (generating || !matchResults) {
      return (
        <div className="text-center py-xxl">
          <LoadingSpinner message={statusMessage} />
          <p className="text-on-surface-variant mt-lg font-body-base">
            Our AI is analyzing your resume against the job description...
          </p>
          <p className="text-body-sm text-on-surface-variant mt-sm">This usually takes 10-20 seconds</p>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto">
        {/* Header Actions */}
        <div className="mb-xl flex items-center justify-between flex-wrap gap-md">
          <button
            onClick={handleReset}
            className="text-primary hover:text-primary-container flex items-center gap-xs font-bold transition-colors"
          >
            <MaterialIcon>arrow_back</MaterialIcon> Start New Match
          </button>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => navigate('/job-match-history')}
              className="text-on-surface-variant hover:text-primary flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg font-body-sm transition-all"
            >
              <MaterialIcon>history</MaterialIcon> View History
            </button>
            <button
              onClick={handleRegenerate}
              disabled={generating}
              className="text-on-surface-variant hover:text-primary flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg font-body-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <MaterialIcon>refresh</MaterialIcon> Regenerate
            </button>
          </div>
        </div>

        {/* Success Message */}
        {statusMessage && !error && (
          <div className="bg-secondary-container border border-secondary text-on-secondary-container px-lg py-md rounded-xl mb-lg">
            <p className="font-body-base">{statusMessage}</p>
          </div>
        )}

        {/* Animated Score Gauge */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl mb-xl text-center">
          <h3 className="font-headline-md text-headline-md mb-lg">Match Score</h3>
          <div className="relative w-48 h-48 mx-auto mb-lg">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="#e1e2ed"
                strokeWidth="16"
                fill="transparent"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="#004ac6"
                strokeWidth="16"
                fill="transparent"
                strokeDasharray="502.65"
                strokeDashoffset={502.65 - (502.65 * matchResults.matchScore) / 100}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-display-lg font-display-lg text-primary">{matchResults.matchScore}%</span>
              <span className="text-label-caps text-on-surface-variant">MATCH</span>
            </div>
          </div>
          <p className="text-body-base text-on-surface-variant max-w-2xl mx-auto">
            {matchResults.matchScore >= 80 ? 'Excellent match! Your resume aligns strongly with this role.' : 
             matchResults.matchScore >= 60 ? 'Good match with room for optimization.' : 
             'Consider strengthening key areas to improve your match.'}
          </p>
        </div>

        {/* Bento Grid Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xl">
          {/* Summary Card */}
          {matchResults.summary && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:col-span-2">
              <div className="flex items-center gap-md mb-md">
                <MaterialIcon className="text-primary text-3xl">summarize</MaterialIcon>
                <h3 className="font-headline-md text-headline-md">AI Summary</h3>
              </div>
              <p className="text-body-base text-on-surface leading-relaxed">{matchResults.summary}</p>
            </div>
          )}

          {/* Matching Skills */}
          <MatchSection
            title="Matching Skills"
            items={matchResults.matchingSkills}
            emptyMessage="No matching skills identified"
            icon="check_circle"
            colorClass="text-secondary"
          />

          {/* Missing Technical Skills */}
          <MatchSection
            title="Missing Technical Skills"
            items={matchResults.missingTechnicalSkills}
            emptyMessage="No missing technical skills"
            icon="engineering"
            colorClass="text-tertiary"
          />

          {/* Missing Soft Skills */}
          <MatchSection
            title="Missing Soft Skills"
            items={matchResults.missingSoftSkills}
            emptyMessage="No missing soft skills"
            icon="psychology"
            colorClass="text-primary"
          />

          {/* Missing Keywords */}
          <MatchSection
            title="Missing Keywords"
            items={matchResults.missingKeywords}
            emptyMessage="No missing keywords"
            icon="key"
            colorClass="text-on-surface-variant"
          />

          {/* Strengths */}
          <MatchSection
            title="Your Strengths"
            items={matchResults.strengths}
            emptyMessage="No strengths identified"
            icon="stars"
            colorClass="text-secondary"
          />

          {/* Recommendations */}
          <MatchSection
            title="AI Recommendations"
            items={matchResults.recommendations}
            emptyMessage="No recommendations"
            icon="lightbulb"
            colorClass="text-primary"
          />

          {/* ATS Optimization Tips */}
          {matchResults.atsOptimizationTips && matchResults.atsOptimizationTips.length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:col-span-2">
              <div className="flex items-center gap-md mb-md">
                <MaterialIcon className="text-tertiary text-3xl">target</MaterialIcon>
                <h3 className="font-headline-md text-headline-md">ATS Optimization Tips</h3>
              </div>
              <ul className="space-y-sm">
                {matchResults.atsOptimizationTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-sm">
                    <MaterialIcon className="text-tertiary text-md mt-1">arrow_right</MaterialIcon>
                    <span className="text-body-base text-on-surface">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Metadata */}
        {matchResults.generatedAt && (
          <div className="text-center mt-xl pt-lg border-t border-outline-variant">
            <p className="text-body-sm text-on-surface-variant">
              Analysis generated {new Date(matchResults.generatedAt).toLocaleString()}
            </p>
            {matchResults.confidenceScore && (
              <p className="text-body-sm text-on-surface-variant mt-xs">
                Confidence Score: {matchResults.confidenceScore}%
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-container-max mx-auto w-full px-lg py-xl">
        {/* Wizard Header & Steps Indicator */}
        <section className="mb-xxl text-center max-w-2xl mx-auto">
          <h1 className="font-display-lg text-display-lg text-on-surface mb-md">Job Match Wizard</h1>
          <p className="text-on-surface-variant mb-xl font-body-base text-body-base">
            Analyze how well your experience aligns with specific roles using our advanced AI matching engine.
          </p>

          {/* Progress Steps */}
          <div className="flex items-center justify-between w-full relative">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant -translate-y-1/2 z-0"></div>
            <div
              className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            ></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center gap-xs">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStep >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {currentStep > 1 ? <MaterialIcon>check</MaterialIcon> : '1'}
              </div>
              <span className={`font-label-caps text-label-caps ${currentStep >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>
                Resume
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center gap-xs">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStep >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {currentStep > 2 ? <MaterialIcon>check</MaterialIcon> : '2'}
              </div>
              <span className={`font-label-caps text-label-caps ${currentStep >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>
                Description
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center gap-xs">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStep >= 3 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                3
              </div>
              <span className={`font-label-caps text-label-caps ${currentStep >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>
                Results
              </span>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-error-container border border-error text-on-error-container px-lg py-md rounded-xl mb-lg max-w-3xl mx-auto">
            <p className="font-body-base text-body-base">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className={`transition-opacity duration-300 ${currentStep === 1 ? 'block' : 'hidden'}`}>
          {currentStep === 1 && renderResumeSelection()}
          {currentStep === 1 && selectedResume && (
            <div className="flex justify-end max-w-5xl mx-auto">
              <button
                onClick={() => {
                  setCurrentStep(2);
                  fetchJobDescriptions();
                }}
                className="bg-primary text-on-primary px-xl py-md rounded-lg font-bold hover:bg-primary-container transition-all flex items-center gap-sm"
              >
                Next: Job Details <MaterialIcon>arrow_forward</MaterialIcon>
              </button>
            </div>
          )}
        </div>

        <div className={`transition-opacity duration-300 ${currentStep === 2 ? 'block' : 'hidden'}`}>
          {currentStep === 2 && renderJobSelection()}
        </div>

        <div className={`transition-opacity duration-300 ${currentStep === 3 ? 'block' : 'hidden'}`}>
          {currentStep === 3 && renderMatchResults()}
        </div>
      </main>
    </div>
  );
};

export default JobMatch;
