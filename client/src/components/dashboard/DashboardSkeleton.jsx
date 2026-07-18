/**
 * Dashboard Skeleton Component
 * Loading skeleton for dashboard page
 */

import { Card } from '../ui';

export const DashboardSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-10 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-200 rounded-lg w-12 h-12"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Default Resume Card Skeleton */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Resumes Skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-64"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-9 bg-gray-200 rounded w-24"></div>
                  <div className="h-9 bg-gray-200 rounded w-24"></div>
                  <div className="h-9 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Exports Skeleton */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-36"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-40 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardSkeleton;
