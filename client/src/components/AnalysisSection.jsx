/**
 * AnalysisSection Component
 * Reusable component for displaying analysis sections
 */

import React from 'react';

const AnalysisSection = ({ title, items, icon, emptyMessage = 'No items to display' }) => {
  if (!items || items.length === 0) {
    return (
      <div className="analysis-section">
        <div className="section-header">
          {icon && <span className="section-icon">{icon}</span>}
          <h3>{title}</h3>
        </div>
        <p className="empty-message">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="analysis-section">
      <div className="section-header">
        {icon && <span className="section-icon">{icon}</span>}
        <h3>{title}</h3>
        <span className="item-count">({items.length})</span>
      </div>
      <ul className="section-list">
        {items.map((item, index) => (
          <li key={index} className="section-item">
            <span className="bullet">•</span>
            <span className="item-text">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnalysisSection;
