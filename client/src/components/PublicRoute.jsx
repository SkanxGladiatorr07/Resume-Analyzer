import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader } from './ui'

/**
 * PublicRoute Component
 * 
 * Wraps routes that should only be accessible when not authenticated (login, register).
 * Redirects authenticated users to the dashboard.
 * Prevents authenticated users from accessing login/register pages.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if not authenticated
 * @returns {JSX.Element} Children if not authenticated, redirect if authenticated, or loader while checking
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loader while checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    )
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Render children if not authenticated
  return children
}

export default PublicRoute
