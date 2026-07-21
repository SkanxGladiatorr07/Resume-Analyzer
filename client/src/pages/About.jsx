import { MaterialIcon } from '../components/ui'

/**
 * About Page
 * Explains project architecture, AI workflow, and technical details
 */
const About = () => {
  return (
    <div className="min-h-screen bg-surface">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">
            About ResumeAI
          </h1>
          <p className="text-xl text-on-surface-variant max-w-3xl mx-auto">
            An intelligent resume analysis platform powered by cutting-edge AI technology
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-surface-container-low rounded-xl p-8 mb-12 border border-outline-variant">
          <h2 className="text-2xl font-bold text-on-surface mb-4">Our Mission</h2>
          <p className="text-body-base text-on-surface-variant leading-relaxed">
            ResumeAI was created to democratize access to professional resume optimization. 
            We believe that everyone deserves a chance to put their best foot forward in the job market, 
            regardless of their background or resources. By leveraging advanced AI technology, we provide 
            instant, actionable feedback that helps job seekers improve their resumes and increase their 
            chances of landing interviews.
          </p>
        </div>

        {/* Architecture Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-on-surface mb-8 text-center">
            System Architecture
          </h2>

          {/* Architecture Diagram */}
          <div className="bg-surface-container-lowest rounded-xl p-8 mb-8 border border-outline-variant">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Frontend */}
              <div className="text-center">
                <div className="bg-primary-container rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <MaterialIcon className="text-4xl text-on-primary-container">web</MaterialIcon>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Frontend</h3>
                <p className="text-body-sm text-on-surface-variant mb-3">React 18 + Vite</p>
                <ul className="text-body-sm text-on-surface-variant space-y-1">
                  <li>• Material Design 3</li>
                  <li>• Tailwind CSS</li>
                  <li>• React Router v6</li>
                  <li>• Axios for API</li>
                  <li>• Context API</li>
                </ul>
              </div>

              {/* Backend */}
              <div className="text-center">
                <div className="bg-secondary-container rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <MaterialIcon className="text-4xl text-on-secondary-container">dns</MaterialIcon>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Backend</h3>
                <p className="text-body-sm text-on-surface-variant mb-3">Node.js + Express</p>
                <ul className="text-body-sm text-on-surface-variant space-y-1">
                  <li>• JWT Authentication</li>
                  <li>• Multer File Upload</li>
                  <li>• Rate Limiting</li>
                  <li>• Input Sanitization</li>
                  <li>• Helmet Security</li>
                </ul>
              </div>

              {/* Data Layer */}
              <div className="text-center">
                <div className="bg-tertiary-container rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <MaterialIcon className="text-4xl text-on-tertiary-container">storage</MaterialIcon>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Data Layer</h3>
                <p className="text-body-sm text-on-surface-variant mb-3">MongoDB + ChromaDB</p>
                <ul className="text-body-sm text-on-surface-variant space-y-1">
                  <li>• User Data</li>
                  <li>• Resume Storage</li>
                  <li>• Vector Embeddings</li>
                  <li>• Semantic Search</li>
                  <li>• Chat History</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tech Stack Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
                <MaterialIcon className="text-primary">code</MaterialIcon>
                Core Technologies
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-on-surface">Frontend:</span>
                  <span className="text-on-surface-variant"> React 18, Vite, Tailwind CSS, Material Design 3</span>
                </div>
                <div>
                  <span className="font-semibold text-on-surface">Backend:</span>
                  <span className="text-on-surface-variant"> Node.js, Express.js, Mongoose</span>
                </div>
                <div>
                  <span className="font-semibold text-on-surface">Database:</span>
                  <span className="text-on-surface-variant"> MongoDB (Atlas), ChromaDB</span>
                </div>
                <div>
                  <span className="font-semibold text-on-surface">AI/ML:</span>
                  <span className="text-on-surface-variant"> Google Gemini 1.5 Pro, Embeddings API</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
                <MaterialIcon className="text-secondary">security</MaterialIcon>
                Security Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MaterialIcon className="text-sm text-green-600">check_circle</MaterialIcon>
                  <span className="text-on-surface-variant">JWT token authentication</span>
                </div>
                <div className="flex items-start gap-2">
                  <MaterialIcon className="text-sm text-green-600">check_circle</MaterialIcon>
                  <span className="text-on-surface-variant">Bcrypt password hashing</span>
                </div>
                <div className="flex items-start gap-2">
                  <MaterialIcon className="text-sm text-green-600">check_circle</MaterialIcon>
                  <span className="text-on-surface-variant">XSS and SQL injection protection</span>
                </div>
                <div className="flex items-start gap-2">
                  <MaterialIcon className="text-sm text-green-600">check_circle</MaterialIcon>
                  <span className="text-on-surface-variant">Rate limiting and CORS</span>
                </div>
                <div className="flex items-start gap-2">
                  <MaterialIcon className="text-sm text-green-600">check_circle</MaterialIcon>
                  <span className="text-on-surface-variant">Helmet.js security headers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Workflow Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-on-surface mb-8 text-center">
            AI Workflow
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-primary">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-on-primary rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
                    Document Upload & Parsing
                  </h3>
                  <p className="text-body-base text-on-surface-variant">
                    User uploads PDF/DOCX resume. The system extracts text using pdf-parse and mammoth libraries,
                    then sends the raw text to Google Gemini API for intelligent parsing into structured data
                    (contact info, experience, education, skills, etc.).
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-secondary">
              <div className="flex items-start gap-4">
                <div className="bg-secondary text-on-secondary rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
                    ATS Analysis Generation
                  </h3>
                  <p className="text-body-base text-on-surface-variant">
                    Gemini AI analyzes the resume against ATS (Applicant Tracking System) best practices,
                    generating scores for formatting, keywords, experience, education, and skills. Returns
                    detailed strengths, weaknesses, and actionable suggestions for improvement.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-tertiary">
              <div className="flex items-start gap-4">
                <div className="bg-tertiary text-on-tertiary rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
                    Vector Embeddings & RAG
                  </h3>
                  <p className="text-body-base text-on-surface-variant">
                    Resume text is chunked and converted into vector embeddings using Google's Embedding API.
                    Stored in ChromaDB for semantic search. When user asks questions, relevant chunks are
                    retrieved and fed to Gemini AI for contextual responses (Retrieval-Augmented Generation).
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-primary">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-on-primary rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
                    Job Matching & Career Tools
                  </h3>
                  <p className="text-body-base text-on-surface-variant">
                    AI compares resume against job descriptions to calculate match scores, identify gaps,
                    and suggest improvements. Additional tools include STAR method generator, interview prep,
                    career roadmap generation, and project suggestions tailored to the user's profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-on-surface mb-8 text-center">
            Technical Highlights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant">
              <MaterialIcon className="text-4xl text-primary mb-3">speed</MaterialIcon>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Real-time Processing</h3>
              <p className="text-body-sm text-on-surface-variant">
                Asynchronous processing with status polling for instant feedback on resume uploads and analysis
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant">
              <MaterialIcon className="text-4xl text-secondary mb-3">psychology</MaterialIcon>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Advanced AI</h3>
              <p className="text-body-sm text-on-surface-variant">
                Google Gemini 1.5 Pro with 128K context window for comprehensive document understanding
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant">
              <MaterialIcon className="text-4xl text-tertiary mb-3">search</MaterialIcon>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Semantic Search</h3>
              <p className="text-body-sm text-on-surface-variant">
                ChromaDB vector database enables intelligent resume content search and contextual chat responses
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant">
              <MaterialIcon className="text-4xl text-primary mb-3">devices</MaterialIcon>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Responsive Design</h3>
              <p className="text-body-sm text-on-surface-variant">
                Material Design 3 with mobile-first approach, works perfectly on all devices and screen sizes
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant">
              <MaterialIcon className="text-4xl text-secondary mb-3">lock</MaterialIcon>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Secure by Design</h3>
              <p className="text-body-sm text-on-surface-variant">
                Multi-layered security with JWT, bcrypt, rate limiting, input sanitization, and HTTPS
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant">
              <MaterialIcon className="text-4xl text-tertiary mb-3">analytics</MaterialIcon>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Detailed Analytics</h3>
              <p className="text-body-sm text-on-surface-variant">
                Comprehensive dashboard with charts, activity timeline, and insights into resume performance
              </p>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold mb-1">&lt;2s</div>
              <div className="text-sm opacity-90">Page Load Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">3-5s</div>
              <div className="text-sm opacity-90">AI Analysis Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">286KB</div>
              <div className="text-sm opacity-90">Bundle Size (gzipped)</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">95+</div>
              <div className="text-sm opacity-90">Lighthouse Score</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default About
