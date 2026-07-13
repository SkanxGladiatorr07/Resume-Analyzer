/**
 * Analysis Page
 * Displays AI-generated resume analysis
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analysisService, resumeService } from '../services';
import { LoadingSpinner, EmptyState } from '../components';
import ATSScoreCard from '../components/ATSScoreCard';
import AnalysisSection from '../components/AnalysisSection';
import '../styles/Analysis.css';

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
      <div className="analysis-page">
        <div className="loading-container">
          <LoadingSpinner />
          <p className="loading-text">
            Loading analysis...
          </p>
        </div>
      </div>
    );
  }

  // Processing state (analysis being generated)
  if (status === 'processing' || status === 'pending' || generating) {
    return (
      <div className="analysis-page">
        <div className="loading-container">
          <LoadingSpinner />
          <p className="loading-text">
            {status === 'pending' ? 'Analysis queued for generation...' : 'Generating AI analysis...'}
          </p>
          <p className="loading-subtext">
            This may take 5-10 seconds. Please wait...
          </p>
          <p className="loading-hint">
            💡 Analysis will automatically appear when ready
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analysis) {
    return (
      <div className="analysis-page">
        <div className="error-container">
          <EmptyState
            title="Analysis Error"
            message={error}
            icon="⚠️"
          />
          <div className="error-actions">
            <button onClick={() => fetchAnalysis()} className="btn btn-primary">
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
                className="btn btn-secondary"
              >
                🔄 Retry Failed Analysis
              </button>
            )}
            <button onClick={handleBack} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No analysis state
  if (!analysis) {
    return (
      <div className="analysis-page">
        <EmptyState
          title="No Analysis Available"
          message="Unable to load analysis for this resume"
          icon="📊"
        />
      </div>
    );
  }

  return (
    <div className="analysis-page">
      {/* Header */}
      <div className="analysis-header">
        <button onClick={handleBack} className="back-button">
          ← Back to Dashboard
        </button>
        
        <div className="header-content">
          <h1>AI Resume Analysis</h1>
          {resume && (
            <p className="resume-name">{resume.originalName}</p>
          )}
        </div>

        <div className="header-actions">
          {cached && (
            <span className="cached-badge">
              ✓ Cached Result
            </span>
          )}
          <button 
            onClick={handleRegenerate} 
            className="btn btn-secondary"
            disabled={generating}
          >
            {generating ? 'Generating...' : '🔄 Regenerate'}
          </button>
        </div>
      </div>

      {/* Generating overlay */}
      {generating && analysis && (
        <div className="generating-overlay">
          <div className="generating-content">
            <LoadingSpinner />
            <p className="generating-text">Regenerating analysis...</p>
            <p className="generating-subtext">This may take 5-10 seconds</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="analysis-content">
        {/* ATS Score - Prominent Display */}
        <ATSScoreCard score={analysis.atsScore} />

        {/* Professional Summary */}
        <div className="summary-section">
          <div className="section-header">
            <span className="section-icon">📝</span>
            <h2>Professional Summary</h2>
          </div>
          <p className="summary-text">{analysis.summary}</p>
        </div>

        {/* Analysis Grid */}
        <div className="analysis-grid">
          {/* Strengths */}
          <AnalysisSection
            title="Strengths"
            items={analysis.strengths}
            icon="✅"
            emptyMessage="No strengths identified"
          />

          {/* Weaknesses */}
          <AnalysisSection
            title="Weaknesses"
            items={analysis.weaknesses}
            icon="⚠️"
            emptyMessage="No weaknesses identified"
          />

          {/* Missing Skills */}
          <AnalysisSection
            title="Missing Skills"
            items={analysis.missingSkills}
            icon="🎯"
            emptyMessage="No missing skills identified"
          />

          {/* Grammar Feedback */}
          <AnalysisSection
            title="Grammar Feedback"
            items={analysis.grammarFeedback}
            icon="📖"
            emptyMessage="No grammar issues found"
          />

          {/* Formatting Feedback */}
          <AnalysisSection
            title="Formatting Feedback"
            items={analysis.formattingFeedback}
            icon="🎨"
            emptyMessage="No formatting issues found"
          />

          {/* Suggestions */}
          <AnalysisSection
            title="Improvement Suggestions"
            items={analysis.suggestions}
            icon="💡"
            emptyMessage="No suggestions available"
          />
        </div>

        {/* Metadata */}
        <div className="analysis-metadata">
          <p className="metadata-text">
            Analysis generated on {new Date(analysis.generatedAt).toLocaleString()}
          </p>
          <p className="metadata-text">
            AI Model: {analysis.aiModel}
          </p>
          {cached && (
            <p className="metadata-text cached-info">
              ℹ️ This is a cached result. Click "Regenerate" for a fresh analysis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analysis;
