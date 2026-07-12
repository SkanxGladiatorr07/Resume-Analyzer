/**
 * ATSScoreCard Component
 * Displays the ATS score prominently
 */

import React from 'react';

const ATSScoreCard = ({ score }) => {
  // Determine score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  // Determine score label
  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="ats-score-card">
      <div className="score-header">
        <h2>ATS Compatibility Score</h2>
        <p className="score-subtitle">
          How well your resume works with Applicant Tracking Systems
        </p>
      </div>
      
      <div className="score-display">
        <div className="score-circle" style={{ borderColor: getScoreColor(score) }}>
          <div className="score-value" style={{ color: getScoreColor(score) }}>
            {score}
          </div>
          <div className="score-max">/100</div>
        </div>
        
        <div className="score-label" style={{ color: getScoreColor(score) }}>
          {getScoreLabel(score)}
        </div>
      </div>

      <div className="score-info">
        <div className="score-range">
          <span className="range-label">Score Range:</span>
          <div className="range-indicators">
            <span className="range-item">
              <span className="range-dot" style={{ backgroundColor: '#ef4444' }}></span>
              0-39: Poor
            </span>
            <span className="range-item">
              <span className="range-dot" style={{ backgroundColor: '#f59e0b' }}></span>
              40-79: Good
            </span>
            <span className="range-item">
              <span className="range-dot" style={{ backgroundColor: '#10b981' }}></span>
              80-100: Excellent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSScoreCard;
