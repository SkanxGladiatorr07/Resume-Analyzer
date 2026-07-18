/**
 * ResumeCard Component
 * Reusable card to display individual resume information
 * 
 * @param {Object} resume - Resume data object
 * @param {Function} onDelete - Delete handler function
 * @param {Function} onViewDetails - View details handler function
 * @param {Function} onTogglePin - Toggle pin handler function
 * @param {Function} onSetDefault - Set default handler function
 * @param {boolean} isDeleting - Whether this resume is being deleted
 */

import { useState } from 'react';
import { Card, Button } from './ui';
import { resumeService } from '../services';

export const ResumeCard = ({ 
  resume, 
  onDelete, 
  onViewDetails, 
  onTogglePin,
  onSetDefault,
  isDeleting = false 
}) => {
  const [showActions, setShowActions] = useState(false);

  /**
   * Get parsing status badge
   */
  const getParsingStatusBadge = () => {
    if (!resume.parsingStatus) return null;

    const statusConfig = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Pending',
      },
      processing: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: (
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ),
        label: 'Processing...',
      },
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ),
        label: `Parsed (${resume.wordCount || 0} words)`,
      },
      failed: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Failed',
      },
    };

    const config = statusConfig[resume.parsingStatus];
    if (!config) return null;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  /**
   * Get file icon based on type
   */
  const getFileIcon = (fileType) => {
    if (fileType === 'pdf') {
      return (
        <svg className="h-10 w-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else {
      return (
        <svg className="h-10 w-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        {/* Left Section - File Info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* File Icon with Badges */}
          <div className="relative flex-shrink-0">
            {getFileIcon(resume.fileType)}
            {/* Pin Badge */}
            {resume.isPinned && (
              <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-1" title="Pinned">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </div>
            )}
            {/* Default Badge */}
            {resume.isDefault && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1" title="Default Resume">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
          </div>

          {/* File Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {resume.originalName}
              </p>
              {resume.isDefault && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Default
                </span>
              )}
              {resume.isPinned && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Pinned
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="uppercase font-semibold">
                {resume.fileType}
              </span>
              <span>•</span>
              <span>{resumeService.formatFileSize(resume.fileSize)}</span>
              <span>•</span>
              <span>{resumeService.formatDate(resume.createdAt)}</span>
            </div>
            {/* Parsing Status */}
            {resume.parsingStatus && (
              <div className="mt-2">
                {getParsingStatusBadge()}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0 relative">
          {/* More Actions Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="small"
              onClick={() => setShowActions(!showActions)}
              title="More actions"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </Button>

            {/* Actions Dropdown */}
            {showActions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActions(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      onTogglePin && onTogglePin(resume._id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {resume.isPinned ? 'Unpin' : 'Pin'} Resume
                  </button>
                  {!resume.isDefault && (
                    <button
                      onClick={() => {
                        onSetDefault && onSetDefault(resume._id);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Set as Default
                    </button>
                  )}
                  {resume.parsingStatus === 'completed' && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          window.location.href = `/resume/${resume._id}/versions`;
                          setShowActions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Version History
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* View Details Button */}
          {resume.parsingStatus === 'completed' && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => onViewDetails(resume._id)}
              title="View parsed resume details"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 6.523 5 10 5c3.477 0 6.268 2.943 7.542 7-1.274 4.057-4.065 7-7.542 7-3.477 0-6.268-2.943-7.542-7z"
                />
              </svg>
              View
            </Button>
          )}

          {/* Analyze Button */}
          {resume.parsingStatus === 'completed' && (
            <Button
              variant="primary"
              size="small"
              onClick={() => window.location.href = `/analysis/${resume._id}`}
              title="View AI Analysis"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Analyze
            </Button>
          )}

          {/* Delete Button */}
          <Button
            variant="danger"
            size="small"
            onClick={() => onDelete(resume._id, resume.originalName)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                Deleting...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
