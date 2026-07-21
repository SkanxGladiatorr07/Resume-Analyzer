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
