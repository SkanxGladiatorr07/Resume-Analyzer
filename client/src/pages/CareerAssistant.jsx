import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import careerService from '../services/careerService';
import resumeService from '../services/resumeService';

const CareerAssistant = () => {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState('rewriter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Resumes list
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');

  // Configuration data
  const [rewriteConfig, setRewriteConfig] = useState(null);
  const [starConfig, setStarConfig] = useState(null);

  // Load resumes on mount
  useEffect(() => {
    loadResumes();
    loadConfigs();
  }, []);

  const loadResumes = async () => {
    try {
      const response = await resumeService.getAllResumes();
      if (response.success && response.data) {
        setResumes(response.data);
        if (response.data.length > 0) {
          setSelectedResume(response.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error loading resumes:', err);
    }
  };

  const loadConfigs = async () => {
    try {
      const [rewriteRes, starRes] = await Promise.all([
        careerService.getRewriteConfig(),
        careerService.getStarConfig(),
      ]);
      if (rewriteRes.success) setRewriteConfig(rewriteRes.data);
      if (starRes.success) setStarConfig(starRes.data);
    } catch (err) {
      console.error('Error loading configs:', err);
    }
  };

  const tools = [
    {
      id: 'rewriter',
      name: 'Resume Rewriter',
      icon: '✍️',
      description: 'Rewrite resume sections with different tones',
    },
    {
      id: 'star',
      name: 'STAR Generator',
      icon: '⭐',
      description: 'Convert experiences into STAR format',
    },
    {
      id: 'interview',
      name: 'Interview Questions',
      icon: '💼',
      description: 'Generate interview questions for your role',
    },
    {
      id: 'projects',
      name: 'Project Suggestions',
      icon: '🚀',
      description: 'Get project ideas to enhance your portfolio',
    },
    {
      id: 'learning',
      name: 'Learning Roadmap',
      icon: '📚',
      description: 'Personalized learning path for your goals',
    },
    {
      id: 'career',
      name: 'Career Roadmap',
      icon: '🎯',
      description: 'Career progression guidance',
    },
  ];

  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    setError(null);
    setSuccess(null);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Career Assistant</h1>
          <p className="mt-2 text-gray-600">
            AI-powered tools to enhance your career journey
          </p>
        </div>

        {/* Tool Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`p-6 rounded-lg border-2 text-left transition-all ${
                activeTool === tool.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="text-4xl mb-3">{tool.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tool.name}
              </h3>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </button>
          ))}
        </div>

        {/* Active Tool Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-red-500 mr-2">⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Tool-specific components */}
          {activeTool === 'rewriter' && (
            <RewriterTool
              resumes={resumes}
              selectedResume={selectedResume}
              setSelectedResume={setSelectedResume}
              config={rewriteConfig}
              loading={loading}
              setLoading={setLoading}
              setError={setError}
              setSuccess={setSuccess}
              clearMessages={clearMessages}
            />
          )}

          {activeTool === 'star' && (
            <StarTool
              resumes={resumes}
              selectedResume={selectedResume}
              setSelectedResume={setSelectedResume}
              config={starConfig}
              loading={loading}
              setLoading={setLoading}
              setError={setError}
              setSuccess={setSuccess}
              clearMessages={clearMessages}
            />
          )}

          {activeTool === 'interview' && (
            <InterviewTool
              resumes={resumes}
              selectedResume={selectedResume}
              setSelectedResume={setSelectedResume}
              loading={loading}
              setLoading={setLoading}
              setError={setError}
              setSuccess={setSuccess}
              clearMessages={clearMessages}
            />
          )}

          {activeTool === 'projects' && (
            <ProjectsTool
              loading={loading}
              setLoading={setLoading}
              setError={setError}
              setSuccess={setSuccess}
              clearMessages={clearMessages}
            />
          )}

          {activeTool === 'learning' && (
            <LearningTool
              loading={loading}
              setLoading={setLoading}
              setError={setError}
              setSuccess={setSuccess}
              clearMessages={clearMessages}
            />
          )}

          {activeTool === 'career' && (
            <CareerTool
              loading={loading}
              setLoading={setLoading}
              setError={setError}
              setSuccess={setSuccess}
              clearMessages={clearMessages}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Resume Rewriter Tool Component
const RewriterTool = ({
  resumes,
  selectedResume,
  setSelectedResume,
  config,
  loading,
  setLoading,
  setError,
  setSuccess,
  clearMessages,
}) => {
  const [section, setSection] = useState('experience');
  const [content, setContent] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!selectedResume) {
      setError('Please select a resume first');
      return;
    }

    if (!content.trim()) {
      setError('Please enter content to rewrite');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await careerService.rewriteContent({
        resumeId: selectedResume,
        section,
        content: content.trim(),
        tone,
      });

      if (response.success) {
        setResult(response.data);
        setSuccess('Content rewritten successfully!');
      } else {
        setError(response.message || 'Failed to rewrite content');
      }
    } catch (err) {
      setError(err.message || 'Failed to rewrite content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Resume Rewriter
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resume Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Resume
          </label>
          <select
            value={selectedResume}
            onChange={(e) => setSelectedResume(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {resumes.length === 0 ? (
              <option>No resumes available</option>
            ) : (
              resumes.map((resume) => (
                <option key={resume._id} value={resume._id}>
                  {resume.fileName || resume.originalName}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section
          </label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="summary">Summary</option>
            <option value="experience">Experience</option>
            <option value="projects">Projects</option>
            <option value="skills">Skills</option>
          </select>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="professional">Professional</option>
            <option value="technical">Technical</option>
            <option value="leadership">Leadership</option>
            <option value="concise">Concise</option>
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content to Rewrite
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter the content you want to rewrite..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length} characters (min: 10, max: 5000)
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedResume || !content.trim()}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Rewriting...' : 'Rewrite Content'}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Rewritten Content
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">
                {result.rewrittenContent}
              </p>
            </div>
          </div>

          {result.improvements && result.improvements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Improvements Made
              </h3>
              <div className="space-y-2">
                {result.improvements.map((improvement, index) => (
                  <div key={index} className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-900">
                      {improvement.type}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {improvement.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// STAR Generator Tool Component
const StarTool = ({
  resumes,
  selectedResume,
  setSelectedResume,
  config,
  loading,
  setLoading,
  setError,
  setSuccess,
  clearMessages,
}) => {
  const [experience, setExperience] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!selectedResume) {
      setError('Please select a resume first');
      return;
    }

    if (!experience.trim()) {
      setError('Please enter an experience to convert');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await careerService.generateStar({
        resumeId: selectedResume,
        experience: experience.trim(),
      });

      if (response.success) {
        setResult(response.data);
        setSuccess('STAR bullet generated successfully!');
      } else {
        setError(response.message || 'Failed to generate STAR bullet');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate STAR bullet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        STAR Generator
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resume Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Resume
          </label>
          <select
            value={selectedResume}
            onChange={(e) => setSelectedResume(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {resumes.length === 0 ? (
              <option>No resumes available</option>
            ) : (
              resumes.map((resume) => (
                <option key={resume._id} value={resume._id}>
                  {resume.fileName || resume.originalName}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Description
          </label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Enter your experience (e.g., 'Built a React dashboard with real-time data visualization')"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {experience.length} characters (min: 15, max: 2000)
          </p>
        </div>

        {/* STAR Format Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">
            STAR Format:
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li><strong>S</strong>ituation - Context or challenge</li>
            <li><strong>T</strong>ask - Your responsibility</li>
            <li><strong>A</strong>ction - What you did</li>
            <li><strong>R</strong>esult - Outcome or impact</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedResume || !experience.trim()}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Generating...' : 'Generate STAR Bullet'}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              STAR Version
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">
                {result.starVersion}
              </p>
            </div>
          </div>

          {result.breakdown && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                STAR Breakdown
              </h3>
              <div className="space-y-3">
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="font-medium text-yellow-900">
                    <strong>Situation:</strong>
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {result.breakdown.situation}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-medium text-green-900">
                    <strong>Task:</strong>
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {result.breakdown.task}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-900">
                    <strong>Action:</strong>
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {result.breakdown.action}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="font-medium text-purple-900">
                    <strong>Result:</strong>
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    {result.breakdown.result}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Interview Questions Tool Component
const InterviewTool = ({
  resumes,
  selectedResume,
  setSelectedResume,
  loading,
  setLoading,
  setError,
  setSuccess,
  clearMessages,
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('mid');

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Interview Questions Generator
      </h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          ⚠️ This tool is coming soon! Backend API endpoint needs to be implemented.
        </p>
      </div>

      <form className="space-y-4 opacity-50 pointer-events-none">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Resume
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option>Select a resume...</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title
          </label>
          <input
            type="text"
            placeholder="e.g., Senior Software Engineer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Level
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead Level</option>
          </select>
        </div>

        <button
          type="button"
          disabled
          className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
        >
          Generate Interview Questions
        </button>
      </form>
    </div>
  );
};

// Project Suggestions Tool Component
const ProjectsTool = ({
  loading,
  setLoading,
  setError,
  setSuccess,
  clearMessages,
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Project Suggestions
      </h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          ⚠️ This tool is coming soon! Backend API endpoint needs to be implemented.
        </p>
      </div>

      <form className="space-y-4 opacity-50 pointer-events-none">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Skills
          </label>
          <textarea
            placeholder="e.g., React, Node.js, MongoDB, Python..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <input
            type="number"
            placeholder="e.g., 3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Career Goal
          </label>
          <input
            type="text"
            placeholder="e.g., Full Stack Developer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          type="button"
          disabled
          className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
        >
          Get Project Suggestions
        </button>
      </form>
    </div>
  );
};

// Learning Roadmap Tool Component
const LearningTool = ({
  loading,
  setLoading,
  setError,
  setSuccess,
  clearMessages,
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Learning Roadmap Generator
      </h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          ⚠️ This tool is coming soon! Backend API endpoint needs to be implemented.
        </p>
      </div>

      <form className="space-y-4 opacity-50 pointer-events-none">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Skills
          </label>
          <textarea
            placeholder="List your current skills..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Role
          </label>
          <input
            type="text"
            placeholder="e.g., DevOps Engineer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timeframe
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
          </select>
        </div>

        <button
          type="button"
          disabled
          className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
        >
          Generate Learning Roadmap
        </button>
      </form>
    </div>
  );
};

// Career Roadmap Tool Component
const CareerTool = ({
  loading,
  setLoading,
  setError,
  setSuccess,
  clearMessages,
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Career Roadmap Generator
      </h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          ⚠️ This tool is coming soon! Backend API endpoint needs to be implemented.
        </p>
      </div>

      <form className="space-y-4 opacity-50 pointer-events-none">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Role
          </label>
          <input
            type="text"
            placeholder="e.g., Software Engineer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Role
          </label>
          <input
            type="text"
            placeholder="e.g., Engineering Manager"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <input
            type="number"
            placeholder="e.g., 5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          type="button"
          disabled
          className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
        >
          Generate Career Roadmap
        </button>
      </form>
    </div>
  );
};

export default CareerAssistant;
