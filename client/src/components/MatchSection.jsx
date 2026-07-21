/**
 * MatchSection Component
 * Reusable component for displaying match analysis sections
 */

import React from 'react';
import { MaterialIcon } from './';

const MatchSection = ({ title, items, emptyMessage, icon, colorClass = 'text-primary' }) => {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
      <div className="flex items-center gap-md mb-md">
        {icon && <MaterialIcon className={`text-3xl ${colorClass}`}>{icon}</MaterialIcon>}
        <h3 className="font-headline-md text-headline-md flex-1">{title}</h3>
        {items && items.length > 0 && (
          <span className="bg-surface-container text-on-surface text-label-caps font-label-caps px-sm py-1 rounded-full">
            {items.length}
          </span>
        )}
      </div>

      {!items || items.length === 0 ? (
        <p className="text-on-surface-variant italic font-body-base">{emptyMessage || 'No items to display'}</p>
      ) : (
        <ul className="space-y-sm">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-sm text-on-surface bg-surface-container px-md py-sm rounded-lg font-body-base"
            >
              <MaterialIcon className="text-on-surface-variant text-md mt-1">arrow_right</MaterialIcon>
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MatchSection;
