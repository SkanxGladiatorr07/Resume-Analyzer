/**
 * ResumeList Component
 * Displays a list of uploaded resumes with actions
 */

import { useState } from 'react';
import { Button, Card } from './ui';
import { formatFileSize, formatDate } from '../services/resumeService';

export const ResumeList = ({ resumes, onDelete, isLoading }) => {
  const [deletingId, setDeletingId] = useState(null);

  /**
   * Handle delete with confirmation
   */
  const handleDelete = async (resumeId, fileName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(resumeId);
    try {
      await onDelete(resumeId);
    } catch (error) {
      // Error handled by parent
    } finally {
      setDeletingId(null);
    }
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

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading resumes...</p>
      </div>
    );
  }

  if (!resumes || resumes.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
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
          <h3 className="mt-4 text-lg font-medium text-gray-900">No resumes yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Upload your first resume to get started with AI analysis.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {resumes.map((resume) => (
        <Card key={resume._id}>
          <div className="flex items-center justify-between">
            {/* Left Section - File Info */}
            <div className="flex items-center space-x-4">
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
                  <span>{formatFileSize(resume.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(resume.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2">
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
                onClick={() => handleDelete(resume._id, resume.originalName)}
                disabled={deletingId === resume._id}
              >
                {deletingId === resume._id ? (
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
      ))}
    </div>
  );
};
