/**
 * EmptyState Component
 * Reusable empty state display for when no data exists
 * 
 * @param {string} icon - Icon type ('document', 'folder', 'search')
 * @param {string} title - Empty state title
 * @param {string} description - Empty state description
 * @param {ReactNode} action - Optional action button/element
 */

import { Card } from './ui';

export const EmptyState = ({
  icon = 'document',
  title = 'No items found',
  description = 'Get started by creating your first item.',
  action = null,
}) => {
  const icons = {
    document: (
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    folder: (
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    ),
    search: (
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  };

  return (
    <Card>
      <div className="text-center py-12">
        {/* Icon */}
        {icons[icon] || icons.document}

        {/* Title */}
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-500">
          {description}
        </p>

        {/* Action */}
        {action && (
          <div className="mt-6">
            {action}
          </div>
        )}
      </div>
    </Card>
  );
};
