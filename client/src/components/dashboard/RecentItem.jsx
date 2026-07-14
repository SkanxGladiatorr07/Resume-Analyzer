/**
 * RecentItem Component
 * Display recent activity items (resumes, analyses, job matches)
 * 
 * @param {string} type - Item type (resume, analysis, jobMatch)
 * @param {Object} item - Item data
 * @param {Function} onClick - Click handler
 */
const RecentItem = ({ type, item, onClick }) => {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Render based on type
  if (type === 'resume') {
    return (
      <div
        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2">
              <svg
                className="h-5 w-5 text-blue-600"
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
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.fileName || 'Untitled Resume'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Uploaded {formatDate(item.uploadedAt || item.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'analysis') {
    return (
      <div
        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-2">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                ATS Score: <span className="text-green-600">{item.atsScore || 'N/A'}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Analyzed {formatDate(item.analyzedAt || item.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'jobMatch') {
    return (
      <div
        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2">
              <svg
                className="h-5 w-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.jobTitle || 'Job Match'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Match Score:{' '}
                <span className="font-medium text-purple-600">
                  {item.matchScore || 'N/A'}%
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RecentItem;
