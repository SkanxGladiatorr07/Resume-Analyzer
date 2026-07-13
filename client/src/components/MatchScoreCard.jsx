/**
 * MatchScoreCard Component
 * Displays the match score prominently with color coding
 */

import React from 'react';

const MatchScoreCard = ({ score, loading = false }) => {
  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
        <div className="animate-pulse">
          <div className="h-24 w-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-gray-300 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-2 rounded-lg p-8 text-center transition-all ${getScoreBgColor(
        score
      )}`}
    >
      <div className="flex flex-col items-center">
        {/* Score Circle */}
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
              className={`${getScoreColor(score)} transition-all duration-1000`}
              strokeLinecap="round"
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score}%
            </span>
          </div>
        </div>

        {/* Score label */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Match Score</h3>
        <p className={`text-lg font-semibold ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </p>
      </div>
    </div>
  );
};

export default MatchScoreCard;
