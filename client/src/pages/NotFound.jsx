import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'

/**
 * NotFound Page (404 Error)
 * Displayed when user navigates to a non-existent route
 */
const NotFound = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-9xl md:text-[12rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 leading-none">
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Oops! Page not found
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </Button>
          
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" fullWidth>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {isAuthenticated ? 'Go to Dashboard' : 'Go Home'}
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/upload" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Upload Resume
                </Link>
                <span className="text-gray-300">•</span>
                <Link to="/analytics" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Analytics
                </Link>
                <span className="text-gray-300">•</span>
                <Link to="/chat" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Resume Chat
                </Link>
                <span className="text-gray-300">•</span>
                <Link to="/job-match" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Job Match
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Login
                </Link>
                <span className="text-gray-300">•</span>
                <Link to="/register" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Decorative Element */}
        <div className="mt-12 opacity-30">
          <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default NotFound
