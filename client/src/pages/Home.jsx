import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BackendStatus from '../components/BackendStatus'
import FeatureSection from '../components/FeatureSection'
import { Button } from '../components/ui'

/**
 * Home Page (Landing Page)
 * Main landing page showcasing features and CTAs
 */
const Home = () => {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: '📄',
      title: 'Smart Resume Upload',
      description: 'Upload your resume in PDF or DOCX format and get instant parsing with AI-powered text extraction',
    },
    {
      icon: '📊',
      title: 'ATS Score Analysis',
      description: 'Check if your resume passes Applicant Tracking Systems with detailed compatibility scores',
    },
    {
      icon: '🤖',
      title: 'AI-Powered Feedback',
      description: 'Get intelligent, personalized feedback powered by advanced AI algorithms to improve your resume',
    },
    {
      icon: '💬',
      title: 'Interactive Resume Chat',
      description: 'Chat with AI to get instant answers and suggestions about your resume content',
    },
    {
      icon: '🎯',
      title: 'Job Match Analysis',
      description: 'Match your resume against job descriptions and get compatibility scores with keyword analysis',
    },
    {
      icon: '📈',
      title: 'Career Tools & Analytics',
      description: 'Access STAR method generator, career roadmaps, interview prep, and detailed analytics',
    },
  ]

  return (
    <div className="bg-gradient-to-b from-white via-blue-50/30 to-white">
      {/* Backend Status */}
      <div className="max-w-7xl mx-auto px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <BackendStatus />
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            Transform Your Resume with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              AI Power
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Get instant AI-powered feedback, ATS scores, and personalized recommendations to land your dream job
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="primary" size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Go to Dashboard
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button variant="outline" size="lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Resume
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    Get Started Free
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap gap-6 justify-center items-center text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free to use
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Instant results
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              AI-powered
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Everything you need to stand out
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureSection
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white mb-16 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Resumes Analyzed</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">AI Availability</div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="text-center bg-white border-2 border-blue-100 rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to land your dream job?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who've improved their resumes with AI
          </p>
          {!isAuthenticated && (
            <Link to="/register">
              <Button variant="primary" size="lg" className="shadow-lg hover:shadow-xl transition-all">
                Create Free Account
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
