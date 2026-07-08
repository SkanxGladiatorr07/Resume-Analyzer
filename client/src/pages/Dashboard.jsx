import { Card } from '../components/ui'

const Dashboard = () => {
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          ResumeAI Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-6">Coming Soon</p>
        <p className="text-base text-gray-500 max-w-2xl mx-auto">
          We're working hard to bring you an amazing dashboard experience. 
          Stay tuned for resume uploads, AI analysis, and personalized recommendations!
        </p>
      </Card>
    </div>
  )
}

export default Dashboard
