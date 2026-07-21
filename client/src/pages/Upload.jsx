import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui';
import { resumeService } from '../services';

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Resume list state
  const [resumes, setResumes] = useState([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // File validation constants
  const ACCEPTED_TYPES = ['.pdf', '.docx'];
  const ACCEPTED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Fetch resumes on component mount
   */
  useEffect(() => {
    fetchResumes();
  }, []);

  /**
   * Fetch all resumes
   */
  const fetchResumes = async () => {
    try {
      setIsLoadingResumes(true);
      const response = await resumeService.getResumes();
      setResumes(response.data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  /**
   * Validate selected file
   */
  const validateFile = (file) => {
    // Check file type by extension
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_TYPES.includes(fileExtension)) {
      return {
        valid: false,
        error: 'Invalid file type. Only PDF and DOCX files are accepted.',
      };
    }

    // Check MIME type
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file format. Please upload a valid PDF or DOCX file.',
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
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
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
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
   * Handle file upload
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Simulate progress (since we don't have real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload file
      const response = await resumeService.uploadResume(selectedFile);

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show success message
      setSuccessMessage(
        `${selectedFile.name} uploaded successfully!`
      );

      // Clear selected file
      setSelectedFile(null);

      // Automatically refresh resume list
      await fetchResumes();

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
      
      // Handle different types of errors
      if (error.response) {
        // Backend validation error
        const backendError = error.response?.data?.message || 
                            'Failed to upload resume. Please try again.';
        setErrorMessage(backendError);
      } else if (error.request) {
        // Network error - no response received
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        // Other errors
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Clear selected file
   */
  const handleClearFile = () => {
    setSelectedFile(null);
    setErrorMessage('');
    setSuccessMessage('');
    setUploadProgress(0);
  };

  /**
   * Handle resume delete
   */
  const handleDeleteResume = async (resumeId, fileName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(resumeId);
    try {
      await resumeService.deleteResume(resumeId);
      
      // Show success message
      setSuccessMessage(`${fileName} deleted successfully!`);
      
      // Refresh resume list
      await fetchResumes();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Delete error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete resume. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 md:py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 md:mb-12 text-center md:text-left">
          <div className="mb-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Upload Your Resume
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed">
              Upload your resume to unlock AI-powered insights, ATS optimization, and personalized career recommendations.
            </p>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-4 mt-6 md:mt-8 justify-center md:justify-start">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200 text-green-700 text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Secure & Encrypted
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200 text-blue-700 text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2c16.012 0 16 0 16 0s.005 13.981-1.031 15.233C17.06 19.268 14.667 20 12 20c-4 0-6-2-8-4l-2 2c2 2 3 3 6 5 3 0 9-1 11-3 2-2 2-13 2-13 0-1-1-2-2-2H3z" /></svg>
              Instant Analysis
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-200 text-purple-700 text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.343a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM15.657 14.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 17a1 1 0 102 0v-1a1 1 0 10-2 0v1zM5.343 15.657a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zM2 10a1 1 0 01 1 1h1a1 1 0 110-2H3a1 1 0 01-1 1zM5.343 5.343a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM10 6a4 4 0 100 8 4 4 0 000-8z" /></svg>
              AI-Powered
            </span>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 animate-slide-down bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 text-green-800 px-4 md:px-6 py-4 rounded-xl flex items-start md:items-center gap-3 shadow-sm">
            <svg className="h-6 w-6 flex-shrink-0 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm md:text-base font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 animate-slide-down bg-gradient-to-r from-red-50 to-orange-50 border border-red-300 text-red-800 px-4 md:px-6 py-4 rounded-xl flex items-start md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start md:items-center gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm md:text-base font-medium">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-600 hover:text-red-800 flex-shrink-0"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 md:mb-12">
          {/* Drop Zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-2xl p-8 md:p-12 lg:p-16 text-center
              transition-all duration-300 ease-in-out
              ${isDragging ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' : 'border-gray-300 bg-white'}
              ${selectedFile ? 'bg-green-50 border-green-500' : ''}
              ${!isUploading ? 'hover:border-blue-400 hover:bg-blue-50 hover:shadow-md' : ''}
              ${isUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isUploading && !selectedFile && document.getElementById('fileInput')?.click()}
          >
            {/* Hidden file input */}
            <input
              id="fileInput"
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />

            {!selectedFile ? (
              <>
                {/* Upload Icon with Animation */}
                <div className="mb-6 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-4">
                    <svg
                      className="w-10 h-10 md:w-12 md:h-12 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                </div>

                {/* Upload Text */}
                <div className="mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                    Drag & Drop Your Resume
                  </h2>
                  <p className="text-gray-600 text-base md:text-lg mb-5">
                    or select from your computer
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 border border-transparent text-base md:text-lg font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-95"
                    disabled={isUploading}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Browse Files
                  </button>
                </div>

                {/* File Requirements */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="font-semibold text-gray-900 mb-4 text-base">Accepted formats & requirements:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <svg className="w-6 h-6 text-red-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">PDF</p>
                      <p className="text-xs text-gray-600">Adobe PDF format</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <svg className="w-6 h-6 text-blue-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">DOCX</p>
                      <p className="text-xs text-gray-600">Word format</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <svg className="w-6 h-6 text-amber-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">Max 5MB</p>
                      <p className="text-xs text-gray-600">File size limit</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="mb-6 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4">
                    <svg
                      className="w-10 h-10 md:w-12 md:h-12 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                </div>

                {/* File Info */}
                <div className="mb-8">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    {selectedFile.name}
                  </h3>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      {formatFileSize(selectedFile.size)}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full">
                      {selectedFile.type.includes('pdf') ? 'PDF' : 'DOCX'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar (shown during upload) */}
                {isUploading && (
                  <div className="mb-8 animate-fade-in">
                    <div className="relative">
                      <div className="flex mb-3 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-sm font-semibold text-blue-600">
                            Uploading...
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="overflow-hidden h-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
                        <div
                          style={{ width: `${uploadProgress}%` }}
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg rounded-full transition-all duration-300"
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!isUploading ? (
                  <div className="flex gap-3 justify-center flex-col md:flex-row">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload();
                      }}
                      className="inline-flex items-center justify-center px-8 py-3 md:py-4 border border-transparent text-base md:text-lg font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-95"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Resume
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearFile();
                      }}
                      className="inline-flex items-center justify-center px-8 py-3 md:py-4 border-2 border-gray-300 text-base md:text-lg font-semibold rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-200 active:scale-95"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 animate-fade-in">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600"></div>
                    <span className="text-gray-600 font-medium">Uploading your resume...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Info Section */}
          <div className="px-8 md:px-12 lg:px-16 py-12 bg-gradient-to-br from-gray-50 to-blue-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Secure Upload</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your files are encrypted end-to-end and stored securely
                </p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Instant Analysis</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Get real-time feedback on your resume within seconds
                </p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">AI-Powered</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Powered by advanced machine learning & NLP technology
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume List Table */}
        {resumes.length > 0 && (
          <Card className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Uploaded Resumes
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} uploaded
              </p>
            </div>

            {/* Table for Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resumes.map((resume) => (
                    <tr key={resume._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {resume.fileType === 'pdf' ? (
                              <svg className="h-10 w-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-10 w-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {resume.originalName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {resumeService.formatFileSize(resume.fileSize)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          resume.fileType === 'pdf' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {resume.fileType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resumeService.formatDate(resume.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteResume(resume._id, resume.originalName)}
                          disabled={deletingId === resume._id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === resume._id ? (
                            <span className="flex items-center">
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                              Deleting...
                            </span>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card View for Mobile */}
            <div className="md:hidden space-y-4">
              {resumes.map((resume) => (
                <div key={resume._id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {resume.fileType === 'pdf' ? (
                        <svg className="h-8 w-8 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-8 w-8 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        resume.fileType === 'pdf' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {resume.fileType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {resume.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {resumeService.formatFileSize(resume.fileSize)} • {resumeService.formatDate(resume.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteResume(resume._id, resume.originalName)}
                    disabled={deletingId === resume._id}
                    className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === resume._id ? (
                      <span className="flex items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </span>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Loading State for Resume List */}
        {isLoadingResumes && resumes.length === 0 && (
          <Card className="mt-8">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading your resumes...</p>
            </div>
          </Card>
        )}

        {/* Back to Dashboard Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
