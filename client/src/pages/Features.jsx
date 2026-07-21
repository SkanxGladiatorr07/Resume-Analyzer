import { MaterialIcon } from '../components/ui'
import { Link } from 'react-router-dom'

/**
 * Features Page
 * Comprehensive overview of all ResumeAI modules and capabilities
 */
const Features = () => {
  const coreFeatures = [
    {
      icon: 'upload_file',
      title: 'Smart Resume Upload',
      description: 'Upload PDF or DOCX resumes with instant validation and parsing',
      details: [
        'Supports PDF and DOCX formats',
        'File size validation (up to 10MB)',
        'Drag-and-drop interface',
        'Multi-resume management',
        'Automatic text extraction',
      ],
      color: 'primary',
    },
    {
      icon: 'analytics',
      title: 'ATS Score Analysis',
      description: 'Get comprehensive resume scores based on ATS compatibility',
      details: [
        'Overall ATS score (0-100)',
        'Formatting quality assessment',
        'Keyword optimization check',
        'Experience evaluation',
        'Education verification',
        'Skills match analysis',
      ],
      color: 'secondary',
    },
    {
      icon: 'psychology',
      title: 'AI-Powered Insights',
      description: 'Intelligent feedback powered by Google Gemini 1.5 Pro',
      details: [
        'Detailed strengths identification',
        'Weakness analysis',
        'Missing skills detection',
        'Grammar and clarity feedback',
        'Actionable suggestions',
        'Industry-specific recommendations',
      ],
      color: 'tertiary',
    },
  ]

  const advancedFeatures = [
    {
      icon: 'work',
      title: 'Job Match Analysis',
      description: 'Compare your resume against job descriptions',
      details: [
        '3-step matching wizard',
        'Match score calculation',
        'Matching skills identification',
        'Missing skills analysis',
        'Gap recommendations',
        'Job match history',
      ],
      color: 'primary',
    },
    {
      icon: 'chat',
      title: 'AI Resume Chat',
      description: 'Interactive conversations about your resume content',
      details: [
        'Natural language Q&A',
        'Semantic search with RAG',
        'Context-aware responses',
        'Chat history persistence',
        'Multiple resume support',
        'Real-time AI streaming',
      ],
      color: 'secondary',
    },
    {
      icon: 'school',
      title: 'Career Assistant Tools',
      description: 'Professional development and career growth tools',
      details: [
        'STAR method generator',
        'Interview question prep',
        'Career roadmap creation',
        'Project suggestions',
        'Resume rewriting',
        'Skills gap analysis',
      ],
      color: 'tertiary',
    },
    {
      icon: 'monitoring',
      title: 'Analytics Dashboard',
      description: 'Track your resume optimization progress',
      details: [
        'Score trends over time',
        'Activity timeline',
        'Export history',
        'Usage statistics',
        'Performance charts',
        'Recent uploads tracking',
      ],
      color: 'primary',
    },
  ]

  const technicalFeatures = [
    {
      icon: 'lock',
      title: 'Secure Authentication',
      description: 'JWT-based authentication with bcrypt password hashing',
    },
    {
      icon: 'cloud_upload',
      title: 'File Management',
      description: 'Secure file storage with validation and processing',
    },
    {
      icon: 'download',
      title: 'Export Options',
      description: 'Download resumes in PDF, JSON formats',
    },
    {
      icon: 'devices',
      title: 'Responsive Design',
      description: 'Optimized for mobile, tablet, and desktop',
    },
    {
      icon: 'dark_mode',
      title: 'Material Design 3',
      description: 'Modern UI with consistent design system',
    },
    {
      icon: 'speed',
      title: 'Fast Performance',
      description: 'Optimized bundle size and lazy loading',
    },
  ]

  return (
    <div className="min-h-screen bg-surface">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">
            Powerful Features for Resume Success
          </h1>
          <p className="text-xl text-on-surface-variant max-w-3xl mx-auto">
            Everything you need to create, analyze, and optimize your resume for maximum impact
          </p>
        </div>

        {/* Core Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-on-surface mb-8">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant hover:shadow-lg transition-shadow"
              >
                <div className={`bg-${feature.color}-container rounded-full w-16 h-16 flex items-center justify-center mb-4`}>
                  <MaterialIcon className={`text-3xl text-on-${feature.color}-container`}>
                    {feature.icon}
                  </MaterialIcon>
                </div>
                <h3 className="text-headline-md font-bold text-on-surface mb-2">{feature.title}</h3>
                <p className="text-body-sm text-on-surface-variant mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                      <MaterialIcon className="text-sm text-green-600 mt-0.5">check_circle</MaterialIcon>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-on-surface mb-8">Advanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advancedFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-surface-container-low rounded-xl p-6 border border-outline-variant"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`bg-${feature.color}-container rounded-full w-14 h-14 flex items-center justify-center flex-shrink-0`}>
                    <MaterialIcon className={`text-2xl text-on-${feature.color}-container`}>
                      {feature.icon}
                    </MaterialIcon>
                  </div>
                  <div>
                    <h3 className="text-headline-md font-bold text-on-surface mb-1">{feature.title}</h3>
                    <p className="text-body-sm text-on-surface-variant">{feature.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-18">
                  {feature.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                      <MaterialIcon className="text-sm text-blue-600 mt-0.5">arrow_forward</MaterialIcon>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-on-surface mb-8">Technical Excellence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant text-center"
              >
                <MaterialIcon className="text-4xl text-primary mb-3">{feature.icon}</MaterialIcon>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{feature.title}</h3>
                <p className="text-body-sm text-on-surface-variant">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Module Breakdown */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-on-surface mb-8">Complete Module Breakdown</h2>
          <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
                  <MaterialIcon className="text-primary">account_circle</MaterialIcon>
                  Authentication Module
                </h3>
                <ul className="space-y-2 text-body-sm text-on-surface-variant">
                  <li>• User registration with validation</li>
                  <li>• Secure login with JWT tokens</li>
                  <li>• Password reset functionality</li>
                  <li>• Protected route management</li>
                  <li>• Session persistence</li>
                </ul>
              </div>

              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
                  <MaterialIcon className="text-secondary">description</MaterialIcon>
                  Resume Management
                </h3>
                <ul className="space-y-2 text-body-sm text-on-surface-variant">
                  <li>• Multi-file upload support</li>
                  <li>• Resume list with search/filter</li>
                  <li>• Default resume selection</li>
                  <li>• Resume deletion with confirmation</li>
                  <li>• File metadata tracking</li>
                </ul>
              </div>

              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
                  <MaterialIcon className="text-tertiary">auto_fix_high</MaterialIcon>
                  AI Processing Pipeline
                </h3>
                <ul className="space-y-2 text-body-sm text-on-surface-variant">
                  <li>• PDF/DOCX text extraction</li>
                  <li>• Structured data parsing</li>
                  <li>• ATS score calculation</li>
                  <li>• Strength/weakness analysis</li>
                  <li>• Suggestion generation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
                  <MaterialIcon className="text-primary">search</MaterialIcon>
                  RAG & Semantic Search
                </h3>
                <ul className="space-y-2 text-body-sm text-on-surface-variant">
                  <li>• Text chunking and embedding</li>
                  <li>• ChromaDB vector storage</li>
                  <li>• Similarity search queries</li>
                  <li>• Context retrieval for chat</li>
                  <li>• Real-time AI responses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Experience All These Features?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Start optimizing your resume today with AI-powered tools
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-bold hover:bg-surface transition-colors"
          >
            Get Started Free
            <MaterialIcon>arrow_forward</MaterialIcon>
          </Link>
        </div>
      </main>
    </div>
  )
}

export default Features
