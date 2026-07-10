/**
 * ResumeUpload Component
 * Provides a drag-and-drop interface for uploading resumes
 */

import { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { Loader } from './ui/Loader';

export const ResumeUpload = ({ onUploadSuccess, onUploadError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Accepted file types
  const acceptedTypes = ['.pdf', '.docx'];
  const acceptedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  /**
   * Validate file type and size
   */
  const validateFile = (file) => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: 'Invalid file type. Only PDF and DOCX files are allowed.',
      };
    }

    // Check mime type
    if (!acceptedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file format. Please upload a valid PDF or DOCX file.',
      };
    }

    // Check file size
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit. Please choose a smaller file.',
      };
    }

    return { valid: true };
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (file) => {
    const validation = validateFile(file);

    if (!validation.valid) {
      onUploadError?.(validation.error);
      return;
    }

    setSelectedFile(file);
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag events
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Trigger file input click
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle upload
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      await onUploadSuccess?.(selectedFile);
      setSelectedFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Cancel file selection
   */
  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center
          transition-all duration-200 ease-in-out
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white'}
          ${selectedFile ? 'bg-green-50 border-green-500' : ''}
          hover:border-indigo-400 hover:bg-gray-50
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {!selectedFile ? (
          <>
            {/* Upload Icon */}
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Upload Text */}
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag and drop your resume here
              </p>
              <p className="text-sm text-gray-500">or</p>
            </div>

            {/* Browse Button */}
            <Button
              onClick={handleBrowseClick}
              variant="primary"
              disabled={isUploading}
            >
              Browse Files
            </Button>

            {/* File Requirements */}
            <p className="mt-4 text-xs text-gray-500">
              Accepted formats: PDF, DOCX (Max 5MB)
            </p>
          </>
        ) : (
          <>
            {/* Success Icon */}
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
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

            {/* File Info */}
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-700 mb-1">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {/* Action Buttons */}
            {!isUploading ? (
              <div className="flex gap-3 justify-center">
                <Button onClick={handleUpload} variant="primary">
                  Upload Resume
                </Button>
                <Button onClick={handleCancel} variant="secondary">
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Loader size="small" />
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
