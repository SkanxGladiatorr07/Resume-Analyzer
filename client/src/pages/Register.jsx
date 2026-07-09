import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services'
import { Button, Card, Input, Loader } from '../components/ui'

const Register = () => {
  const navigate = useNavigate()
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
      
      const response = await authService.register(registerData)
      
      // Store token
      authService.setToken(response.data.token)
      
      // Redirect to dashboard
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join ResumeAI and start optimizing your resume
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            {apiError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {apiError}
              </div>
            )}

            <Input
              label="Name"
              type="text"
              name="name"
              placeholder="John Doe"
              required
              error={errors.name?.message}
              register={register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="john@example.com"
              required
              error={errors.email?.message}
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
              register={register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader size="sm" /> : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Register
