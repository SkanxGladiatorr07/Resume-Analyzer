/**
 * LoadingSpinner Component
 * Reusable loading spinner with optional text
 * 
 * @param {string} size - Spinner size ('small', 'medium', 'large')
 * @param {string} text - Optional loading text
 * @param {boolean} fullScreen - Whether to show as fullscreen overlay
 */

import { Card } from './ui';

export const LoadingSpinner = ({
  size = 'medium',
  text = 'Loading...',
  fullScreen = false,
}) => {
  const sizes = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizes[size]}`}
      ></div>
      {text && (
        <p className="mt-3 text-sm text-gray-600">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
        {spinner}
      </div>
    );
  }

  return (
    <Card>
      <div className="py-12">
        {spinner}
      </div>
    </Card>
  );
};

export default LoadingSpinner;
