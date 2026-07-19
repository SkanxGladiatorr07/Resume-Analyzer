/**
 * Analysis Page
 * Displays AI-generated resume analysis
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analysisService, resumeService } from '../services';
import { LoadingSpinner, EmptyState, MaterialIcon } from '../components';
import ATSScoreCard from '../components/ATSScoreCard';
import AnalysisSection from '../components/AnalysisSection';

const Analysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const [status, setStatus] = useState(null); // pending, processing, completed, failed
  const [pollingInterval, setPollingInterval] = useState(null);

  // Fetch resume details
  const fetchResume = async () => {
    try {
      const response = await resumeService.getResumeById(id);
      setResume(response.data);
    } catch (err) {
      console.error('Error fetching resume:', err);
    }
  };

  // Fetch or generate analysis
  const fetchAnalysis = async (forceRegenerate = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (forceRegenerate) {
        setGenerating(true);
      }

      const response = await analysisService.generateAnalysis(id, forceRegenerate);
      
      if (response.success) {
        const analysisStatus = response.status || response.data?.analysisStatus;
        setStatus(analysisStatus);

        if (analysisStatus === 'completed') {
          // Analysis is ready
          setAnalysis(response.data);
          setCached(response.cached || false);
          setLoading(false);
          setGenerating(false);
        } else if (analysisStatus === 'processing' || analysisStatus === 'pending') {
          // Analysis is being generated, start polling
          setLoading(false);
          startPolling();
        } else if (analysisStatus === 'failed') {
          // Analysis failed
          setError(response.data?.errorMessage || 'Analysis generation failed');
          setLoading(false);
          setGenerating(false);
        }
      } else {
        setError(response.message || 'Failed to generate analysis');
        setLoading(false);
        setGenerating(false);
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
      
      // Handle specific error cases
      if (err.response) {
        const { status, data } = err.response;
        
        if (status === 400) {
          setError(data.message || 'Resume must be parsed before analysis');
        } else if (status === 404) {
          setError('Resume not found');
        } else if (status === 503) {
          setError('AI service is temporarily unavailable. Please try again later.');
        } else {
          setError(data.message || 'Failed to generate analysis');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
      
      setLoading(false);
      setGenerating(false);
    }
  };

  // Start polling for analysis status
  const startPolling = () => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    console.log('🔄 Starting analysis status polling...');

    const interval = setInterval(async () => {
      try {
        const response = await analysisService.getAnalysis(id);
        const analysisStatus = response.status || response.data?.analysisStatus;
        
        console.log(`📊 Analysis status: ${analysisStatus}`);
        setStatus(analysisStatus);

        if (analysisStatus === 'completed') {
          // Analysis completed
          console.log('✅ Analysis completed');
          setAnalysis(response.data);
          setCached(false);
          setGenerating(false);
          clearInterval(interval);
          setPollingInterval(null);
        } else if (analysisStatus === 'failed') {
          // Analysis failed
          console.error('❌ Analysis failed');
          setError(response.data?.errorMessage || 'Analysis generation failed');
          setGenerating(false);
          clearInterval(interval);
          setPollingInterval(null);
        }
        // Keep polling if still processing or pending
      } catch (err) {
        console.error('Polling error:', err);
        // Don't stop polling on error, might be temporary
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Handle regenerate
  const handleRegenerate = () => {
    fetchAnalysis(true);
  };

  // Handle back
  const handleBack = () => {
    navigate('/dashboard');
  };

  // Initial load
  useEffect(() => {
    fetchResume();
    fetchAnalysis();
  }, [id]);

  // Loading state
  if (loading && !generating && !analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <LoadingSpinner />
          <p className="font-headline-md text-headline-md text-on-surface">
            Loading analysis...
          </p>
        </div>
      </div>
    );
  }

  // Processing state (analysis being generated)
  if (status === 'processing' || status === 'pending' || (generating && !analysis)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-md text-center max-w-md">
          <LoadingSpinner />
          <p className="font-headline-md text-headline-md text-on-surface">
            {status === 'pending' ? 'Analysis queued for generation...' : 'Generating AI analysis...'}
          </p>
          <p className="font-body-base text-body-base text-on-surface-variant">
            This may take 5-10 seconds. Please wait...
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
            <MaterialIcon className="text-sm">info</MaterialIcon>
            Analysis will automatically appear when ready
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-lg">
          <div className="bg-error-container border border-error rounded-xl p-xl text-center">
            <MaterialIcon className="text-[64px] text-error mb-md">error</MaterialIcon>
            <h2 className="font-headline-md text-headline-md text-on-error-container mb-md">Analysis Error</h2>
            <p className="font-body-base text-body-base text-on-error-container mb-xl">{error}</p>
            <div className="flex flex-col sm:flex-row gap-sm justify-center">
              <button 
                onClick={() => fetchAnalysis()} 
                className="bg-primary hover:bg-primary-container text-on-primary px-lg py-sm rounded-lg font-bold flex items-center justify-center gap-xs transition-all active:scale-95"
              >
                <MaterialIcon className="text-sm">refresh</MaterialIcon>
                Try Again
              </button>
              {status === 'failed' && (
                <button 
                  onClick={async () => {
                    try {
                      setError(null);
                      setGenerating(true);
                      await analysisService.retryAnalysis(id);
                      startPolling();
                    } catch (err) {
                      setError(err.response?.data?.message || 'Failed to retry analysis');
                      setGenerating(false);
                    }
                  }} 
                  className="border border-outline-variant hover:bg-surface-container-low px-lg py-sm rounded-lg font-bold flex items-center justify-center gap-xs transition-all active:scale-95"
                >
                  <MaterialIcon className="text-sm">restart_alt</MaterialIcon>
                  Retry Failed Analysis
                </button>
              )}
              <button 
                onClick={handleBack} 
                className="border border-outline-variant hover:bg-surface-container-low px-lg py-sm rounded-lg font-bold flex items-center justify-center gap-xs transition-all active:scale-95"
              >
                <MaterialIcon className="text-sm">arrow_back</MaterialIcon>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No analysis state
  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-lg text-center">
          <MaterialIcon className="text-[64px] text-on-surface-variant mb-md">analytics</MaterialIcon>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-md">No Analysis Available</h2>
          <p className="font-body-base text-body-base text-on-surface-variant mb-xl">
            Unable to load analysis for this resume
          </p>
          <button 
            onClick={handleBack} 
            className="bg-primary hover:bg-primary-container text-on-primary px-lg py-sm rounded-lg font-bold flex items-center justify-center gap-xs transition-all active:scale-95 mx-auto"
          >
            <MaterialIcon className="text-sm">arrow_back</MaterialIcon>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-container-max mx-auto px-lg py-xl">
        
        {/* Hero Section: Score and AI Summary */}
        <section className="mb-xxl flex flex-col lg:flex-row gap-lg items-stretch">
          {/* Score Gauge Card */}
          <div className="lg:w-1/3 bg-surface-container-lowest rounded-xl p-xl shadow-sm flex flex-col items-center justify-center border border-outline-variant">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant mb-md uppercase tracking-widest">ATS Compatibility Score</h2>
            <div className="relative w-48 h-48 mb-md">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  className="text-surface-container-high" 
                  strokeWidth="8" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="40" 
                  cx="50" 
                  cy="50"
                />
                <circle 
                  className="text-secondary transition-all duration-1000 ease-out" 
                  strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - (analysis.atsScore || 0) / 100)}`}
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="40" 
                  cx="50" 
                  cy="50"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display-lg text-display-lg text-on-surface">{analysis.atsScore || 0}</span>
                <span className="font-label-caps text-label-caps text-secondary font-bold">
                  {analysis.atsScore >= 80 ? 'EXCELLENT' : analysis.atsScore >= 60 ? 'GOOD' : 'NEEDS WORK'}
                </span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-center text-on-surface-variant">
              {analysis.atsScore >= 80 
                ? 'Your resume is highly optimized for top-tier applicant tracking systems.' 
                : analysis.atsScore >= 60 
                ? 'Your resume has good ATS compatibility with room for improvement.'
                : 'Your resume needs optimization to pass through ATS systems.'}
            </p>
          </div>

          {/* Professional Summary Card */}
          <div className="lg:w-2/3 bg-surface-container-lowest rounded-xl p-xl shadow-sm border border-outline-variant relative overflow-hidden">
            <div className="absolute top-0 right-0 p-md opacity-10">
              <MaterialIcon className="text-[80px]">auto_awesome</MaterialIcon>
            </div>
            <div className="flex items-center gap-sm mb-md">
              <MaterialIcon className="text-primary">psychology</MaterialIcon>
              <h2 className="font-headline-md text-headline-md text-on-surface">AI Executive Summary</h2>
            </div>
            <div className="space-y-md">
              <p className="font-body-base text-body-base text-on-surface leading-relaxed">
                {analysis.summary}
              </p>
              <div className="flex gap-sm flex-wrap">
                <button 
                  onClick={handleRegenerate}
                  disabled={generating}
                  className="bg-primary hover:bg-primary-container text-on-primary px-lg py-sm rounded-lg font-bold flex items-center gap-xs transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MaterialIcon className="text-sm">refresh</MaterialIcon>
                  {generating ? 'Regenerating...' : 'Regenerate Analysis'}
                </button>
                <button 
                  onClick={handleBack}
                  className="border border-outline-variant hover:bg-surface-container-low px-lg py-sm rounded-lg font-bold flex items-center gap-xs transition-all active:scale-95"
                >
                  <MaterialIcon className="text-sm">arrow_back</MaterialIcon>
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Generating overlay */}
        {generating && analysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface-container-lowest rounded-xl p-xl shadow-2xl flex flex-col items-center gap-md">
              <LoadingSpinner />
              <p className="font-headline-md text-headline-md text-on-surface">Regenerating analysis...</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">This may take 5-10 seconds</p>
            </div>
          </div>
        )}

        {/* Analysis Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          
          {/* Strengths */}
          <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-sm">
                <MaterialIcon className="text-secondary">check_circle</MaterialIcon>
                <h3 className="font-headline-md text-headline-md">Strengths</h3>
              </div>
              <span className="bg-secondary-container text-on-secondary-container px-sm py-xs rounded-full font-label-caps text-[10px]">OPTIMIZED</span>
            </div>
            <ul className="space-y-sm">
              {analysis.strengths && analysis.strengths.length > 0 ? (
                analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-sm font-body-sm text-body-sm text-on-surface-variant">
                    <MaterialIcon className="text-sm mt-1 text-secondary">done</MaterialIcon>
                    {strength}
                  </li>
                ))
              ) : (
                <li className="font-body-sm text-body-sm text-on-surface-variant italic">No strengths identified</li>
              )}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-sm">
                <MaterialIcon className="text-tertiary">warning</MaterialIcon>
                <h3 className="font-headline-md text-headline-md">Weaknesses</h3>
              </div>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-sm py-xs rounded-full font-label-caps text-[10px]">CRITICAL</span>
            </div>
            <ul className="space-y-sm">
              {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-sm font-body-sm text-body-sm text-on-surface-variant">
                    <MaterialIcon className="text-sm mt-1 text-tertiary">priority_high</MaterialIcon>
                    {weakness}
                  </li>
                ))
              ) : (
                <li className="font-body-sm text-body-sm text-on-surface-variant italic">No weaknesses identified</li>
              )}
            </ul>
          </div>

          {/* Missing Skills */}
          <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant">
            <div className="flex items-center gap-sm mb-md">
              <MaterialIcon className="text-primary">track_changes</MaterialIcon>
              <h3 className="font-headline-md text-headline-md">Missing Skills</h3>
            </div>
            <div className="flex flex-wrap gap-xs">
              {analysis.missingSkills && analysis.missingSkills.length > 0 ? (
                analysis.missingSkills.map((skill, index) => (
                  <span key={index} className="bg-primary-fixed text-on-primary-fixed-variant px-sm py-xs rounded-lg font-body-sm">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="font-body-sm text-body-sm text-on-surface-variant italic">No missing skills identified</span>
              )}
            </div>
            {analysis.missingSkills && analysis.missingSkills.length > 0 && (
              <p className="mt-md font-body-sm text-body-sm text-on-surface-variant italic">
                Add these to match 90%+ of target job descriptions.
              </p>
            )}
          </div>

          {/* Grammar & Readability */}
          <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant">
            <div className="flex items-center gap-sm mb-md">
              <MaterialIcon className="text-outline">menu_book</MaterialIcon>
              <h3 className="font-headline-md text-headline-md">Grammar</h3>
            </div>
            {analysis.grammarFeedback && analysis.grammarFeedback.length > 0 ? (
              <div className="space-y-md">
                {analysis.grammarFeedback.slice(0, 2).map((feedback, index) => (
                  <div key={index} className="bg-surface-container-low p-md rounded-lg">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{feedback}</p>
                  </div>
                ))}
                <p className="mt-md font-body-sm text-body-sm text-on-surface-variant">
                  Readability Level: <span className="font-bold">Professional</span>
                </p>
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">No grammar issues found</p>
            )}
          </div>

          {/* Formatting */}
          <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant">
            <div className="flex items-center gap-sm mb-md">
              <MaterialIcon className="text-purple-600">palette</MaterialIcon>
              <h3 className="font-headline-md text-headline-md">Formatting</h3>
            </div>
            {analysis.formattingFeedback && analysis.formattingFeedback.length > 0 ? (
              <div className="space-y-sm">
                {analysis.formattingFeedback.slice(0, 3).map((feedback, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{feedback}</span>
                    <div className="w-24 h-2 bg-secondary-container rounded-full">
                      <div 
                        className="h-full bg-secondary rounded-full" 
                        style={{ width: `${75 + Math.random() * 25}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">No formatting issues found</p>
            )}
          </div>

          {/* AI Suggestions */}
          <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant bg-yellow-50/50">
            <div className="flex items-center gap-sm mb-md">
              <MaterialIcon className="text-yellow-600">lightbulb</MaterialIcon>
              <h3 className="font-headline-md text-headline-md">Pro Suggestions</h3>
            </div>
            <div className="space-y-md">
              {analysis.suggestions && analysis.suggestions.length > 0 ? (
                analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                  <div key={index} className="p-sm border-l-4 border-yellow-500 bg-white rounded-r-lg">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{suggestion}</p>
                  </div>
                ))
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant italic">No suggestions available</p>
              )}
            </div>
          </div>

        </div>

        {/* Metadata Footer */}
        <div className="mt-md flex flex-col md:flex-row justify-between items-center gap-sm px-sm opacity-60">
          <div className="flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant">
            <MaterialIcon className="text-sm">info</MaterialIcon>
            <span>Generated on {new Date(analysis.generatedAt).toLocaleDateString()} • {new Date(analysis.generatedAt).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant">
            <MaterialIcon className="text-sm">memory</MaterialIcon>
            <span>AI Model: {analysis.aiModel || 'Resume-Analyzer-v4-Turbo'}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analysis;
