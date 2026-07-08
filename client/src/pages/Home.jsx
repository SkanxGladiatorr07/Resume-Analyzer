import BackendStatus from '../components/BackendStatus'
import FeatureSection from '../components/FeatureSection'
import { Button } from '../components/ui'

const Home = () => {
  const features = [
    {
      icon: '📄',
      title: 'Resume Upload',
      description: 'Upload your resume in PDF or DOCX format for instant analysis',
    },
    {
      icon: '📊',
      title: 'ATS Analysis',
      description: 'Check if your resume passes Applicant Tracking Systems',
    },
    {
      icon: '🤖',
      title: 'AI Resume Feedback',
      description: 'Get intelligent feedback powered by advanced AI algorithms',
    },
    {
      icon: '💬',
      title: 'Resume Chat',
      description: 'Interactive chat to improve your resume with AI assistance',
    },
    {
      icon: '🎯',
      title: 'Job Match Analysis',
      description: 'Match your resume with job descriptions and get compatibility scores',
    },
    {
      icon: '📚',
      title: 'Resume History',
      description: 'Track and manage multiple resume versions and analysis results',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Backend Status */}
      <div className="flex justify-center mb-8">
        <BackendStatus />
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-blue-600">ResumeAI</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          AI-Powered Resume Analysis Platform
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((feature) => (
          <FeatureSection
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>

      {/* CTA Section */}
      <div className="text-center bg-blue-600 rounded-lg p-8 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Ready to Optimize Your Resume?
        </h2>
        <p className="text-base mb-6">
          Get started with ResumeAI and take your career to the next level
        </p>
        <Button variant="secondary" size="md">
          Get Started
        </Button>
      </div>
    </div>
  )
}

export default Home
