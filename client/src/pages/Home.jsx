import BackendStatus from '../components/BackendStatus'

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Backend Status Section */}
      <div className="flex justify-center mb-8">
        <BackendStatus />
      </div>

      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-blue-600">ResumeAI</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          AI-Powered Resume Analysis Platform
        </p>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Optimize your resume with advanced AI technology and increase your chances of landing your dream job
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <FeatureCard
          icon="📄"
          title="Resume Upload"
          description="Upload your resume in PDF or DOCX format for instant analysis"
        />
        <FeatureCard
          icon="🤖"
          title="AI Analysis"
          description="Get intelligent feedback powered by advanced AI algorithms"
        />
        <FeatureCard
          icon="📊"
          title="ATS Check"
          description="Ensure your resume passes Applicant Tracking Systems"
        />
        <FeatureCard
          icon="💡"
          title="Smart Tips"
          description="Receive personalized recommendations to improve your resume"
        />
        <FeatureCard
          icon="🎯"
          title="Keyword Match"
          description="Match your resume with job description keywords"
        />
        <FeatureCard
          icon="📈"
          title="Score & Track"
          description="Track your progress with detailed scoring metrics"
        />
      </div>

      {/* CTA Section */}
      <div className="text-center bg-blue-600 rounded-lg p-12 text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Optimize Your Resume?
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Get started with ResumeAI and take your career to the next level
        </p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition duration-200">
          Get Started
        </button>
      </div>
    </div>
  )
}

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-200">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

export default Home
