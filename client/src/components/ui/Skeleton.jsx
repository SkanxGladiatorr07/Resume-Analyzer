/**
 * Skeleton Component
 * Loading placeholder with animation
 * 
 * @component
 */
import React from 'react';
import PropTypes from 'prop-types';

const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
  circle = false,
}) => {
  const variants = {
    text: 'h-4',
    title: 'h-8',
    button: 'h-10',
    card: 'h-32',
    avatar: 'h-12 w-12 rounded-full',
    thumbnail: 'h-24 w-24',
  };
  
  const baseClass = `
    animate-pulse bg-gray-200 rounded
    ${circle ? 'rounded-full' : ''}
    ${variants[variant] || ''}
  `.trim().replace(/\s+/g, ' ');
  
  const style = {
    ...(width && { width }),
    ...(height && { height }),
  };
  
  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`${baseClass} ${className}`}
            style={style}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={`${baseClass} ${className}`}
      style={style}
    />
  );
};

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'title', 'button', 'card', 'avatar', 'thumbnail']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  count: PropTypes.number,
  circle: PropTypes.bool,
};

/**
 * Card Skeleton - Pre-built card loading state
 */
export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
    <Skeleton variant="title" width="60%" />
    <Skeleton variant="text" count={3} />
  </div>
);

/**
 * List Skeleton - Pre-built list loading state
 */
export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="80%" />
        </div>
      </div>
    ))}
  </div>
);

ListSkeleton.propTypes = {
  count: PropTypes.number,
};

/**
 * Table Skeleton - Pre-built table loading state
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-4 border-b border-gray-200">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} variant="text" width={`${100 / columns}%`} />
        ))}
      </div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width={`${100 / columns}%`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
};

export default Skeleton;
