/**
 * ScoreCard Component
 * Unified score display component with configurable styling
 * Replaces ATSScoreCard and MatchScoreCard with a single reusable component
 * 
 * @component
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Get color based on score thresholds
 * @param {number} score - Score value (0-100)
 * @param {string} variant - Color variant (default or tailwind)
 * @returns {string} Color value
 */
const getScoreColor = (score, variant = 'default') => {
  if (variant === 'tailwind') {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }
  
  // Default hex colors
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#fb923c';
  return '#ef4444';
};

/**
 * Get background color based on score
 * @param {number} score - Score value (0-100)
 * @returns {string} Background color classes
 */
const getScoreBgColor = (score) => {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-yellow-50 border-yellow-200';
  if (score >= 40) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};

/**
 * Get label based on score
 * @param {number} score - Score value (0-100)
 * @param {string} type - Score type (ats or match)
 * @returns {string} Label text
 */
const getScoreLabel = (score, type = 'ats') => {
  const labels = {
    ats: {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Needs Improvement',
    },
    match: {
      excellent: 'Excellent Match',
      good: 'Good Match',
      fair: 'Fair Match',
      poor: 'Poor Match',
    },
  };
  
  const typeLabels = labels[type] || labels.ats;
  
  if (score >= 80) return typeLabels.excellent;
  if (score >= 60) return typeLabels.good;
  if (score >= 40) return typeLabels.fair;
  return typeLabels.poor;
};

/**
 * ScoreCard Component
 */
const ScoreCard = ({
  score,
  title = 'Score',
  subtitle,
  type = 'ats',
  variant = 'default',
  showRanges = false,
  loading = false,
  className = '',
}) => {
  // Memoize calculations
  const scoreColor = useMemo(() => getScoreColor(score, variant === 'modern' ? 'tailwind' : 'default'), [score, variant]);
  const scoreBg = useMemo(() => getScoreBgColor(score), [score]);
  const scoreLabel = useMemo(() => getScoreLabel(score, type), [score, type]);
  
  // Loading state
  if (loading) {
    return (
      <div className={`bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <div className="animate-pulse">
          <div className="h-24 w-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-24 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // Modern variant (Tailwind-based)
  if (variant === 'modern') {
    return (
      <div className={`border-2 rounded-lg p-8 text-center transition-all ${scoreBg} ${className}`}>
        <div className="flex flex-col items-center">
          {/* Score Circle with SVG */}
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                className={`${scoreColor} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            {/* Score text overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-4xl font-bold ${scoreColor}`}>
                {score}%
              </span>
            </div>
          </div>
          
          {/* Labels */}
          <h3 className="text-xl font-semibold text-gray-800 mb-1">{title}</h3>
          <p className={`text-lg font-medium ${scoreColor}`}>{scoreLabel}</p>
          {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}
        </div>
      </div>
    );
  }
  
  // Default variant (Custom CSS)
  return (
    <div className={`ats-score-card ${className}`}>
      <div className="score-header">
        <h2>{title}</h2>
        {subtitle && <p className="score-subtitle">{subtitle}</p>}
      </div>
      
      <div className="score-display">
        <div className="score-circle" style={{ borderColor: scoreColor }}>
          <div className="score-value" style={{ color: scoreColor }}>
            {score}
          </div>
          <div className="score-max">/100</div>
        </div>
        
        <div className="score-label" style={{ color: scoreColor }}>
          {scoreLabel}
        </div>
      </div>

      {showRanges && (
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
      )}
    </div>
  );
};

ScoreCard.propTypes = {
  score: PropTypes.number.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  type: PropTypes.oneOf(['ats', 'match']),
  variant: PropTypes.oneOf(['default', 'modern']),
  showRanges: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default React.memo(ScoreCard);
