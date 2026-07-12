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
        setAnalysis(response.data);
        setCached(response.cached);
      } else {
        setError(response.message || 'Failed to generate analysis');
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
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

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
  if (loading && !generating) {
    return (
      <div className="analysis-page">
        <div className="loading-container">
          <LoadingSpinner />
          <p className="loading-text">
            {generating ? 'Generating AI analysis...' : 'Loading analysis...'}
          </p>
          <p className="loading-subtext">
            {generating && 'This may take 5-10 seconds'}
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
      {generating && (
        <div className="generating-overlay">
          <div className="generating-content">
            <LoadingSpinner />
            <p className="generating-text">Generating fresh analysis...</p>
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
