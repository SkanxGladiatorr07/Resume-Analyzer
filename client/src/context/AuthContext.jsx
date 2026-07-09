import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services'

// Create Auth Context
const AuthContext = createContext(null)

/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context.
 * Must be used within AuthProvider.
 * 
 * @returns {Object} Auth context value with user, methods, and states
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * AuthProvider Component
 * 
 * Provides authentication context to the entire application.
 * Manages user state, authentication status, and session persistence.
 * Automatically restores user session on app load if valid token exists.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Context provider wrapping children
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize auth state on component mount
  useEffect(() => {
    initializeAuth()
  }, [])

  /**
   * Initialize Authentication
   * 
   * Checks for existing token in localStorage and validates it.
   * Automatically restores user session if token is valid.
   * Called once when the app loads.
   */
  const initializeAuth = async () => {
    const token = authService.getToken()
    
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      // Verify token by fetching user profile
      const response = await authService.getProfile()
      setUser(response.data.user)
      setIsAuthenticated(true)
    } catch (error) {
      // Token is invalid or expired - clean up
      authService.removeToken()
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Login Method
   * 
   * Authenticates user with email and password.
   * Stores token and updates auth state on success.
   * 
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise} API response
   * @throws {Error} If login fails
   */
  const login = async (credentials) => {
    const response = await authService.login(credentials)
    const { user: userData, token } = response.data
    
    authService.setToken(token)
    setUser(userData)
    setIsAuthenticated(true)
    
    return response
  }

  /**
   * Register Method
   * 
   * Creates new user account.
   * Stores token and updates auth state on success.
   * 
   * @param {Object} userData - Registration data
   * @param {string} userData.name - User full name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @returns {Promise} API response
   * @throws {Error} If registration fails
   */
  const register = async (userData) => {
    const response = await authService.register(userData)
    const { user: newUser, token } = response.data
    
    authService.setToken(token)
    setUser(newUser)
    setIsAuthenticated(true)
    
    return response
  }

  /**
   * Logout Method
   * 
   * Logs out the current user.
   * Removes token and clears auth state.
   */
  const logout = () => {
    authService.removeToken()
    setUser(null)
    setIsAuthenticated(false)
  }

  // Context value object
  const value = {
    user,               // Current user object
    isLoading,          // Loading state during auth check
    isAuthenticated,    // Boolean auth status
    login,              // Login function
    register,           // Register function
    logout,             // Logout function
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
