import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth()
  }, [])

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
      // Token is invalid or expired
      authService.removeToken()
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials) => {
    const response = await authService.login(credentials)
    const { user: userData, token } = response.data
    
    authService.setToken(token)
    setUser(userData)
    setIsAuthenticated(true)
    
    return response
  }

  const register = async (userData) => {
    const response = await authService.register(userData)
    const { user: newUser, token } = response.data
    
    authService.setToken(token)
    setUser(newUser)
    setIsAuthenticated(true)
    
    return response
  }

  const logout = () => {
    authService.removeToken()
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
