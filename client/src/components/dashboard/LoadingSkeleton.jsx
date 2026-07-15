/**
 * LoadingSkeleton Components
 * Skeleton loaders for dashboard components
 */

/**
 * Skeleton for StatCard
 */
export const StatCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-gray-200 rounded-lg p-3 w-12 h-12" />
        <div className="ml-4 flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for ChartCard
 */
export const ChartCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="mb-4">
        <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64" />
      </div>
      <div className="w-full h-64 bg-gray-100 rounded" />
    </div>
  );
};

/**
 * Skeleton for RecentItem
 */
export const RecentItemSkeleton = () => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 bg-gray-200 rounded-lg w-9 h-9" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for Activity Timeline
 */
export const ActivityTimelineSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start space-x-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for Quick Actions
 */
export const QuickActionsSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg animate-pulse"
          >
            <div className="w-6 h-6 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Full Dashboard Skeleton
 */
export const DashboardSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Skeleton */}
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-6 bg-gray-200 rounded w-96" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="mb-8">
        <QuickActionsSkeleton />
      </div>

      {/* Charts Skeleton */}
      <div className="space-y-8 mb-8">
        <ChartCardSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      </div>

      {/* Activity Timeline Skeleton */}
      <ActivityTimelineSkeleton />
    </div>
  );
};

/**
 * Stats Grid Skeleton
 */
export const StatsGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Charts Section Skeleton
 */
export const ChartsSectionSkeleton = () => {
  return (
    <div className="space-y-8">
      <ChartCardSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
};
