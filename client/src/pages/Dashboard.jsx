import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Card className="text-center" padding="p-12">
        <div className="mb-6">
          <div className="inline-block p-6 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-16 h-16 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Welcome, {user?.name}!
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Your ResumeAI dashboard is ready.
        </p>
        
        <p className="text-base text-gray-500 max-w-2xl mx-auto">
          Start building your optimized resume with AI-powered analysis and recommendations.
          Upload your resume to get started with personalized feedback.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📄 Upload Resume</h3>
            <p className="text-sm text-gray-600">
              Coming soon - Upload your resume in PDF or DOCX format
            </p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">🤖 AI Analysis</h3>
            <p className="text-sm text-gray-600">
              Coming soon - Get intelligent feedback and suggestions
            </p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📊 Track Progress</h3>
            <p className="text-sm text-gray-600">
              Coming soon - Monitor your resume improvement over time
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
