/**
 * QuickActions Component
 * Display quick action buttons for common tasks
 * 
 * @param {Function} onUpload - Upload resume handler
 * @param {Function} onAnalyze - Analyze resume handler
 * @param {Function} onCompare - Compare with job handler
 * @param {Function} onHistory - View history handler
 */
const QuickActions = ({ onUpload, onAnalyze, onCompare, onHistory }) => {
  const actions = [
    {
      id: 'upload',
      label: 'Upload Resume',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
      color: 'blue',
      onClick: onUpload,
    },
    {
      id: 'analyze',
      label: 'Analyze Resume',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      color: 'green',
      onClick: onAnalyze,
    },
    {
      id: 'compare',
      label: 'Compare with Job',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      color: 'purple',
      onClick: onCompare,
    },
    {
      id: 'history',
      label: 'View Resume History',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'orange',
      onClick: onHistory,
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50',
    },
    green: {
      bg: 'bg-green-600 hover:bg-green-700',
      text: 'text-green-600',
      lightBg: 'bg-green-50',
    },
    purple: {
      bg: 'bg-purple-600 hover:bg-purple-700',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50',
    },
    orange: {
      bg: 'bg-orange-600 hover:bg-orange-700',
      text: 'text-orange-600',
      lightBg: 'bg-orange-50',
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const colors = colorClasses[action.color];
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`flex flex-col items-center justify-center p-4 ${colors.lightBg} rounded-lg hover:shadow-md transition-all duration-200 group`}
            >
              <div className={`${colors.text} mb-2 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
