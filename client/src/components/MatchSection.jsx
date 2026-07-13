/**
 * MatchSection Component
 * Reusable component for displaying match analysis sections
 */

import React from 'react';

const MatchSection = ({ title, items, emptyMessage, icon, colorClass = 'text-blue-600' }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className={`text-xl ${colorClass}`}>{icon}</span>}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {items && items.length > 0 && (
          <span className="ml-auto bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
            {items.length}
          </span>
        )}
      </div>

      {!items || items.length === 0 ? (
        <p className="text-gray-500 italic">{emptyMessage || 'No items to display'}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-gray-700 bg-gray-50 px-4 py-3 rounded-md"
            >
              <span className="text-gray-400 mt-0.5">•</span>
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MatchSection;
