import { MaterialIcon } from '../components/ui'
import { useState } from 'react'

/**
 * Demo Guide Page
 * Step-by-step guide for testing the application
 */
const DemoGuide = () => {
  const [expandedStep, setExpandedStep] = useState(null)

  const demoSteps = [
    {
      id: 1,
      title: 'Setup & Authentication',
      icon: 'login',
      time: '2 minutes',
      steps: [
        {
          action: 'Register Account',
          details: 'Navigate to /register and create a new account',
          credentials: 'Email: demo@resumeai.com | Password: Demo123!',
        },
        {
          action: 'Login',
          details: 'Use the credentials to log into the application',
          note: 'JWT token is stored in localStorage for 7 days',
        },
        {
          action: 'Explore Dashboard',
          details: 'Check the main dashboard with stats and recent activity',
        },
      ],
    },
    {
      id: 2,
      title: 'Upload & Parse Resume',
      icon: 'upload_file',
      time: '3 minutes',
      steps: [
        {
          action: 'Navigate to Upload Page',
          details: 'Click "Upload Resume" from navbar or dashboard',
        },
        {
          action: 'Upload Resume',
          details: 'Drag and drop or select a PDF/DOCX resume file',
          testFiles: 'Use sample resumes from docs/assets/seed/sample-resumes/',
        },
        {
          action: 'Wait for Processing',
          details: 'Resume will be parsed automatically (5-10 seconds)',
          note: 'Status changes: uploaded → parsing → parsed',
        },
        {
          action: 'View Parsed Data',
          details: 'Click on the resume to see structured data extraction',
        },
      ],
    },
    {
      id: 3,
      title: 'Generate ATS Analysis',
      icon: 'analytics',
      time: '2 minutes',
      steps: [
        {
          action: 'Go to Analysis Page',
          details: 'Click "View Analysis" from resume card or navigate to /analysis/:id',
        },
        {
          action: 'Generate Analysis',
          details: 'Click "Generate Analysis" button if not already analyzed',
          note: 'First analysis takes 3-5 seconds, subsequent views are instant (cached)',
        },
        {
          action: 'Explore Analysis Results',
          details: 'Review ATS score, strengths, weaknesses, missing skills, suggestions',
        },
        {
          action: 'Regenerate (Optional)',
          details: 'Click regenerate for fresh analysis',
        },
      ],
    },
    {
      id: 4,
      title: 'Test Job Matching',
      icon: 'work',
      time: '4 minutes',
      steps: [
        {
          action: 'Navigate to Job Match',
          details: 'Go to /job-match from navbar',
        },
        {
          action: 'Step 1: Select Resume',
          details: 'Choose which resume to match against the job',
        },
        {
          action: 'Step 2: Enter Job Details',
          details: 'Fill in job title, company, and paste job description',
          sample: 'Use sample job descriptions from docs/assets/seed/sample-jobs.json',
        },
        {
          action: 'Step 3: View Match Results',
          details: 'See match score, matching skills, missing skills, and recommendations',
        },
        {
          action: 'Check Match History',
          details: 'Navigate to /job-match-history to see all past matches',
        },
      ],
    },
    {
      id: 5,
      title: 'AI Resume Chat',
      icon: 'chat',
      time: '5 minutes',
      steps: [
        {
          action: 'Open Chat Interface',
          details: 'Navigate to /chat from navbar',
        },
        {
          action: 'Select Resume',
          details: 'Choose which resume to chat about',
        },
        {
          action: 'Start Chat Session',
          details: 'Click "Start Chat" to create a new session',
        },
        {
          action: 'Ask Questions',
          details: 'Try sample questions about your resume',
          examples: [
            '"What are my key skills?"',
            '"Summarize my work experience"',
            '"How can I improve my resume?"',
            '"What projects should I add?"',
          ],
        },
        {
          action: 'Test RAG',
          details: 'Ask specific questions - AI retrieves relevant context from resume',
        },
      ],
    },
    {
      id: 6,
      title: 'Career Assistant Tools',
      icon: 'school',
      time: '6 minutes',
      steps: [
        {
          action: 'Navigate to Career Assistant',
          details: 'Go to /career-assistant from navbar',
        },
        {
          action: 'Test STAR Method',
          details: 'Generate STAR format responses for interview questions',
        },
        {
          action: 'Interview Prep',
          details: 'Get AI-generated interview questions based on your resume',
        },
        {
          action: 'Career Roadmap',
          details: 'Generate a personalized learning path',
        },
        {
          action: 'Project Suggestions',
          details: 'Get project ideas to strengthen your resume',
        },
        {
          action: 'Resume Rewrite',
          details: 'Test AI rewriting of resume sections',
        },
      ],
    },
    {
      id: 7,
      title: 'Analytics Dashboard',
      icon: 'monitoring',
      time: '3 minutes',
      steps: [
        {
          action: 'View Analytics',
          details: 'Navigate to /analytics to see dashboard',
        },
        {
          action: 'Check Score Trends',
          details: 'View ATS score improvements over time',
        },
        {
          action: 'Activity Timeline',
          details: 'Review recent uploads, analyses, and matches',
        },
        {
          action: 'Export History',
          details: 'See list of exported resumes and reports',
        },
      ],
    },
  ]

  const testCredentials = {
    demo: {
      email: 'demo@resumeai.com',
      password: 'Demo123!',
      description: 'Pre-configured demo account with sample data',
    },
    test: {
      email: 'test@example.com',
      password: 'Test123!',
      description: 'Fresh account for testing from scratch',
    },
  }

  return (
    <div className="min-h-screen bg-surface">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">
            Demo Testing Guide
          </h1>
          <p className="text-xl text-on-surface-variant max-w-3xl mx-auto">
            Follow this step-by-step guide to test all features of ResumeAI
          </p>
        </div>

        {/* Test Credentials */}
        <div className="bg-surface-container-low rounded-xl p-6 mb-12 border border-outline-variant">
          <h2 className="text-2xl font-bold text-on-surface mb-4 flex items-center gap-2">
            <MaterialIcon className="text-primary">vpn_key</MaterialIcon>
            Test Credentials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(testCredentials).map(([key, creds]) => (
              <div key={key} className="bg-surface-container-lowest rounded-lg p-4 border border-outline-variant">
                <h3 className="font-bold text-on-surface mb-2 capitalize">{key} Account</h3>
                <div className="space-y-1 text-body-sm font-mono">
                  <div className="flex gap-2">
                    <span className="text-on-surface-variant">Email:</span>
                    <span className="text-primary">{creds.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-on-surface-variant">Password:</span>
                    <span className="text-primary">{creds.password}</span>
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-2">{creds.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Steps */}
        <div className="space-y-6 mb-12">
          {demoSteps.map((step) => (
            <div
              key={step.id}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden"
            >
              <button
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-on-primary rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">
                    {step.id}
                  </div>
                  <div className="text-left">
                    <h3 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
                      <MaterialIcon>{step.icon}</MaterialIcon>
                      {step.title}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant">
                      Estimated time: {step.time}
                    </p>
                  </div>
                </div>
                <MaterialIcon className="text-on-surface-variant">
                  {expandedStep === step.id ? 'expand_less' : 'expand_more'}
                </MaterialIcon>
              </button>

              {expandedStep === step.id && (
                <div className="px-6 pb-6 space-y-4">
                  {step.steps.map((substep, index) => (
                    <div key={index} className="flex gap-4 pb-4 border-b border-outline-variant last:border-0">
                      <div className="bg-secondary-container text-on-secondary-container rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-on-surface mb-1">{substep.action}</h4>
                        <p className="text-body-sm text-on-surface-variant mb-2">{substep.details}</p>
                        {substep.credentials && (
                          <div className="bg-primary-container text-on-primary-container px-3 py-2 rounded text-body-sm font-mono">
                            {substep.credentials}
                          </div>
                        )}
                        {substep.testFiles && (
                          <div className="bg-surface-container px-3 py-2 rounded text-body-sm">
                            📁 {substep.testFiles}
                          </div>
                        )}
                        {substep.sample && (
                          <div className="bg-surface-container px-3 py-2 rounded text-body-sm">
                            💡 {substep.sample}
                          </div>
                        )}
                        {substep.note && (
                          <div className="flex items-start gap-2 mt-2 text-body-sm text-on-surface-variant">
                            <MaterialIcon className="text-sm">info</MaterialIcon>
                            <span>{substep.note}</span>
                          </div>
                        )}
                        {substep.examples && (
                          <div className="mt-2">
                            <p className="text-body-sm font-bold text-on-surface mb-1">Try these:</p>
                            <ul className="space-y-1">
                              {substep.examples.map((example, i) => (
                                <li key={i} className="text-body-sm text-on-surface-variant pl-4">
                                  {example}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Testing Checklist */}
        <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant mb-12">
          <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
            <MaterialIcon className="text-primary">checklist</MaterialIcon>
            Complete Testing Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                User registration works
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                Login/logout functions
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                Resume upload successful
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                Resume parsing completes
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                ATS analysis generates
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                All scores display correctly
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                Job matching works
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                Chat responds correctly
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                Career tools functional
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                Analytics dashboard loads
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                Mobile responsive
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" className="w-4 h-4" />
                No console errors
              </label>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-error-container rounded-xl p-6 border border-error">
          <h2 className="text-2xl font-bold text-on-error-container mb-4 flex items-center gap-2">
            <MaterialIcon>build</MaterialIcon>
            Troubleshooting
          </h2>
          <div className="space-y-3 text-body-sm text-on-error-container">
            <div>
              <p className="font-bold">Backend not running?</p>
              <p>Run: <code className="bg-surface-container px-2 py-1 rounded">cd server && npm start</code></p>
            </div>
            <div>
              <p className="font-bold">Frontend not loading?</p>
              <p>Run: <code className="bg-surface-container px-2 py-1 rounded">cd client && npm run dev</code></p>
            </div>
            <div>
              <p className="font-bold">Database connection failed?</p>
              <p>Check MONGODB_URI in server/.env file</p>
            </div>
            <div>
              <p className="font-bold">AI features not working?</p>
              <p>Verify GEMINI_API_KEY is set in server/.env</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DemoGuide
