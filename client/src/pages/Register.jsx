import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Input, Loader } from '../components/ui'

const Register = () => {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    setApiError('')

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = data
      
      await registerUser(registerData)
      navigate('/dashboard')
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setApiError(errorData.errors.map(err => err.message).join(', '))
        } else {
          setApiError(errorData.message || 'Registration failed')
        }
      } else {
        setApiError('Network error. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Logo and Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">
              Resume<span className="text-blue-600">AI</span>
            </span>
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
          <p className="text-base text-gray-600">
            Join thousands using AI to build better resumes
          </p>
        </div>

        <Card variant="elevated" className="shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {apiError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start space-x-3 animate-slide-down">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{apiError}</span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                name="name"
                placeholder="John Doe"
                required
                error={errors.name?.message}
                leftIcon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                register={register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                })}
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="john@example.com"
                required
                error={errors.email?.message}
                leftIcon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
                register={register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Minimum 8 characters"
                required
                error={errors.password?.message}
                helperText="Use 8+ characters with a mix of letters and numbers"
                leftIcon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                register={register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                required
                error={errors.confirmPassword?.message}
                leftIcon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                register={register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              className="shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader size="sm" />
                  <span className="ml-2">Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign in instead
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </Card>

        {/* Trust Indicators */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            🚀 Get started in less than 60 seconds
          </p>
          <p className="text-xs text-gray-500">
            🔒 Your data is safe and encrypted
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
