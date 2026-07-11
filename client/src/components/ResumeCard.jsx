/**
 * ResumeCard Component
 * Reusable card to display individual resume information
 * 
 * @param {Object} resume - Resume data object
 * @param {Function} onDelete - Delete handler function
 * @param {Function} onViewText - View extracted text handler function
 * @param {boolean} isDeleting - Whether this resume is being deleted
 */

import { Card, Button } from './ui';
import { resumeService } from '../services';

export const ResumeCard = ({ resume, onDelete, onViewText, isDeleting = false }) => {
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
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ),
        label: 'Parsing...',
      },
      success: {
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
          {/* File Icon */}
          <div className="flex-shrink-0">
            {getFileIcon(resume.fileType)}
          </div>

          {/* File Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {resume.originalName}
            </p>
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
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* View Text Button */}
          {resume.parsingStatus === 'success' && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => onViewText(resume._id)}
              title="View extracted text"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View Text
            </Button>
          )}

          {/* Analyze Button (Coming Soon) */}
          <Button
            variant="primary"
            size="small"
            disabled
            title="Coming Soon"
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
