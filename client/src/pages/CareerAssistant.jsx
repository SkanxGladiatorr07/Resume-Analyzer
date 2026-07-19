import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import careerService from '../services/careerService';
import resumeService from '../services/resumeService';
import { MaterialIcon } from '../components';

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
      icon: 'edit',
      description: 'Optimize your bullet points for high-impact keywords and professional tone.',
    },
    {
      id: 'star',
      name: 'STAR Generator',
      icon: 'star',
      description: 'Transform vague experiences into compelling Situation, Task, Action, Result stories.',
    },
    {
      id: 'interview',
      name: 'Interview Questions',
      icon: 'work',
      description: 'Get personalized practice questions based on your specific experience levels.',
    },
    {
      id: 'projects',
      name: 'Project Suggestions',
      icon: 'rocket_launch',
      description: 'Identify skill gaps and get tailored project ideas to bolster your portfolio.',
    },
    {
      id: 'learning',
      name: 'Learning Roadmap',
      icon: 'school',
      description: 'A curated curriculum to master the technologies mentioned in target job posts.',
    },
    {
      id: 'career',
      name: 'Career Roadmap',
      icon: 'track_changes',
      description: 'Visualize your 5-year trajectory from Junior to Executive leadership roles.',
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

  const activeTool Data = tools.find(t => t.id === activeTool);

  return (
    <div className="min-h-screen bg-surface">
      <main className="max-w-container-max mx-auto px-lg md:px-xxl py-xl">
        {/* Header Section */}
        <section className="mb-xxl flex flex-col md:flex-row md:items-end justify-between gap-lg">
          <div className="space-y-sm">
            <h1 className="font-display-lg text-display-lg text-on-surface">Career Assistant Hub</h1>
            <p className="text-on-surface-variant max-w-2xl font-body-base">
              Leverage AI-driven tools to refine your professional narrative, prepare for interviews, and map out your next career milestone.
            </p>
          </div>
          <div className="w-full md:w-72">
            <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Active Resume</label>
            <div className="relative">
              <select 
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm pr-xl focus:outline-none focus:border-primary text-body-base"
              >
                <option value="">Select a resume...</option>
                {resumes.map((resume) => (
                  <option key={resume._id} value={resume._id}>
                    {resume.fileName || resume.originalName}
                  </option>
                ))}
              </select>
              <MaterialIcon className="absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</MaterialIcon>
            </div>
          </div>
        </section>

        {/* Tool Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-xxl">
          {tools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`group bg-surface-container-lowest border p-lg rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg relative overflow-hidden ${
                activeTool === tool.id ? 'border-primary shadow-lg transform -translate-y-1' : 'border-outline-variant hover:border-primary/50'
              }`}
            >
              <MaterialIcon className="text-4xl mb-md text-primary">{tool.icon}</MaterialIcon>
              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">{tool.name}</h3>
              <p className="text-body-sm text-on-surface-variant mt-sm">{tool.description}</p>
              <div className="absolute top-0 right-0 p-md opacity-0 group-hover:opacity-100 transition-opacity">
                <MaterialIcon className="text-primary">arrow_forward</MaterialIcon>
              </div>
            </div>
          ))}
        </section>

        {/* Dynamic Tool Content Area */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="p-lg md:p-xl border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
            <div className="flex items-center gap-md">
              <MaterialIcon className="text-3xl text-primary">{activeToolData?.icon}</MaterialIcon>
              <h2 className="font-headline-md text-headline-md text-on-surface">{activeToolData?.name}</h2>
            </div>
            <button className="flex items-center gap-sm px-md py-sm bg-primary text-on-primary rounded-lg font-label-caps font-bold hover:bg-primary-container transition-colors">
              <MaterialIcon className="text-sm">bolt</MaterialIcon>
              Generate AI Insight
            </button>
          </div>
          <div className="p-lg md:p-xl min-h-[400px]">
            {/* Messages */}
            {error && (
              <div className="mb-lg p-md bg-error-container border border-error rounded-lg">
                <div className="flex items-start">
                  <MaterialIcon className="text-error mr-sm">warning</MaterialIcon>
                  <p className="text-body-sm text-on-error-container">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-lg p-md bg-secondary-container border border-secondary rounded-lg">
                <div className="flex items-start">
                  <MaterialIcon className="text-secondary mr-sm">check_circle</MaterialIcon>
                  <p className="text-body-sm text-on-secondary-container">{success}</p>
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
        </section>
      </main>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
      {/* Input Side */}
      <div className="space-y-lg">
        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Select Resume</label>
          <select
            value={selectedResume}
            onChange={(e) => setSelectedResume(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
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

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={loading}
          >
            <option value="summary">Summary</option>
            <option value="experience">Experience</option>
            <option value="projects">Projects</option>
            <option value="skills">Skills</option>
          </select>
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={loading}
          >
            <option value="professional">Professional</option>
            <option value="technical">Technical</option>
            <option value="leadership">Leadership</option>
            <option value="concise">Concise</option>
          </select>
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Content to Rewrite</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste the bullet point you want to improve..."
            rows={6}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={loading}
          />
          <p className="text-label-caps text-on-surface-variant mt-xs">
            {content.length} characters (min: 10, max: 5000)
          </p>
        </div>

        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading || !selectedResume || !content.trim()}
          className="w-full py-md px-lg bg-primary text-on-primary rounded-lg hover:bg-primary-container disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed transition-colors font-bold"
        >
          {loading ? 'Rewriting...' : 'Rewrite Content'}
        </button>
      </div>

      {/* Output Side */}
      <div>
        {result ? (
          <div className="space-y-lg">
            <div className="bg-surface-container-low rounded-xl p-lg border border-dashed border-outline">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Rewritten Content</h3>
              <p className="text-body-base text-on-surface whitespace-pre-wrap">{result.rewrittenContent}</p>
            </div>

            {result.improvements && result.improvements.length > 0 && (
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Improvements Made</h3>
                <div className="space-y-sm">
                  {result.improvements.map((improvement, index) => (
                    <div key={index} className="bg-primary-fixed p-md rounded-lg">
                      <p className="font-bold text-primary">{improvement.type}</p>
                      <p className="text-body-sm text-on-surface mt-xs">{improvement.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-xl p-lg border border-dashed border-outline flex flex-col justify-center items-center text-center h-full">
            <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-md">
              <MaterialIcon className="text-primary text-3xl">auto_awesome</MaterialIcon>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface">AI Suggestions will appear here</h4>
            <p className="text-body-sm text-on-surface-variant mt-sm max-w-sm">
              Select an experience block or paste text on the left to start optimizing your resume content with industry-standard keywords.
            </p>
          </div>
        )}
      </div>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
      <div className="space-y-lg">
        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Select Resume</label>
          <select
            value={selectedResume}
            onChange={(e) => setSelectedResume(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base focus:ring-1 focus:ring-primary"
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

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Experience Description</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Enter your experience (e.g., 'Built a React dashboard with real-time data visualization')"
            rows={6}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-body-base focus:ring-1 focus:ring-primary"
            disabled={loading}
          />
          <p className="text-label-caps text-on-surface-variant mt-xs">
            {experience.length} characters (min: 15, max: 2000)
          </p>
        </div>

        <div className="bg-primary-fixed p-md rounded-lg">
          <p className="text-body-sm font-bold text-primary mb-sm">STAR Format:</p>
          <ul className="space-y-xs text-label-caps text-on-surface">
            <li><strong>S</strong>ituation - Context or challenge</li>
            <li><strong>T</strong>ask - Your responsibility</li>
            <li><strong>A</strong>ction - What you did</li>
            <li><strong>R</strong>esult - Outcome or impact</li>
          </ul>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !selectedResume || !experience.trim()}
          className="w-full py-md px-lg bg-primary text-on-primary rounded-lg hover:bg-primary-container disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed transition-colors font-bold"
        >
          {loading ? 'Generating...' : 'Generate STAR Bullet'}
        </button>
      </div>

      <div>
        {result ? (
          <div className="space-y-lg">
            <div className="bg-surface-container-low rounded-xl p-lg border border-dashed border-outline">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-md">STAR Version</h3>
              <p className="text-body-base text-on-surface whitespace-pre-wrap">{result.starVersion}</p>
            </div>

            {result.breakdown && (
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-md">STAR Breakdown</h3>
                <div className="space-y-sm">
                  <div className="bg-secondary-container p-md rounded-lg">
                    <p className="font-bold text-secondary"><strong>Situation:</strong></p>
                    <p className="text-body-sm text-on-surface mt-xs">{result.breakdown.situation}</p>
                  </div>
                  <div className="bg-primary-fixed p-md rounded-lg">
                    <p className="font-bold text-primary"><strong>Task:</strong></p>
                    <p className="text-body-sm text-on-surface mt-xs">{result.breakdown.task}</p>
                  </div>
                  <div className="bg-tertiary-fixed p-md rounded-lg">
                    <p className="font-bold text-tertiary"><strong>Action:</strong></p>
                    <p className="text-body-sm text-on-surface mt-xs">{result.breakdown.action}</p>
                  </div>
                  <div className="bg-secondary-fixed p-md rounded-lg">
                    <p className="font-bold text-secondary"><strong>Result:</strong></p>
                    <p className="text-body-sm text-on-surface mt-xs">{result.breakdown.result}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-xl p-lg border border-dashed border-outline flex flex-col justify-center items-center text-center h-full">
            <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-md">
              <MaterialIcon className="text-primary text-3xl">auto_awesome</MaterialIcon>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface">STAR Format Will Appear Here</h4>
            <p className="text-body-sm text-on-surface-variant mt-sm max-w-sm">
              Input a specific accomplishment, and our AI will structure it into a perfect Situation-Task-Action-Result format.
            </p>
          </div>
        )}
      </div>
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
  return (
    <div>
      <div className="bg-tertiary-container/10 border border-tertiary-container rounded-lg p-lg mb-lg">
        <p className="text-body-sm text-on-surface flex items-center gap-sm">
          <MaterialIcon className="text-tertiary">construction</MaterialIcon>
          This tool is coming soon! Backend API endpoint needs to be implemented.
        </p>
      </div>

      <div className="space-y-lg opacity-50 pointer-events-none">
        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Select Resume</label>
          <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base">
            <option>Select a resume...</option>
          </select>
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Job Title</label>
          <input
            type="text"
            placeholder="e.g., Senior Software Engineer"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base"
          />
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Experience Level</label>
          <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base">
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead Level</option>
          </select>
        </div>

        <button
          type="button"
          disabled
          className="w-full py-md px-lg bg-surface-container text-on-surface-variant rounded-lg cursor-not-allowed font-bold"
        >
          Generate Interview Questions
        </button>
      </div>
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
      <div className="bg-tertiary-container/10 border border-tertiary-container rounded-lg p-lg mb-lg">
        <p className="text-body-sm text-on-surface flex items-center gap-sm">
          <MaterialIcon className="text-tertiary">construction</MaterialIcon>
          This tool is coming soon! Backend API endpoint needs to be implemented.
        </p>
      </div>

      <div className="space-y-lg opacity-50 pointer-events-none">
        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Current Skills</label>
          <textarea
            placeholder="e.g., React, Node.js, MongoDB, Python..."
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-body-base"
          />
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Years of Experience</label>
          <input
            type="number"
            placeholder="e.g., 3"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base"
          />
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Career Goal</label>
          <input
            type="text"
            placeholder="e.g., Full Stack Developer"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base"
          />
        </div>

        <button
          type="button"
          disabled
          className="w-full py-md px-lg bg-surface-container text-on-surface-variant rounded-lg cursor-not-allowed font-bold"
        >
          Get Project Suggestions
        </button>
      </div>
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
      <div className="bg-tertiary-container/10 border border-tertiary-container rounded-lg p-lg mb-lg">
        <p className="text-body-sm text-on-surface flex items-center gap-sm">
          <MaterialIcon className="text-tertiary">construction</MaterialIcon>
          This tool is coming soon! Backend API endpoint needs to be implemented.
        </p>
      </div>

      <div className="space-y-lg opacity-50 pointer-events-none">
        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Current Skills</label>
          <textarea
            placeholder="List your current skills..."
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-body-base"
          />
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Target Role</label>
          <input
            type="text"
            placeholder="e.g., DevOps Engineer"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base"
          />
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Timeframe</label>
          <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base">
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
          </select>
        </div>

        <button
          type="button"
          disabled
          className="w-full py-md px-lg bg-surface-container text-on-surface-variant rounded-lg cursor-not-allowed font-bold"
        >
          Generate Learning Roadmap
        </button>
      </div>
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
      <div className="bg-tertiary-container/10 border border-tertiary-container rounded-lg p-lg mb-lg">
        <p className="text-body-sm text-on-surface flex items-center gap-sm">
          <MaterialIcon className="text-tertiary">construction</MaterialIcon>
          This tool is coming soon! Backend API endpoint needs to be implemented.
        </p>
      </div>

      <div className="space-y-lg opacity-50 pointer-events-none">
        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Current Role</label>
          <input
            type="text"
            placeholder="e.g., Software Engineer"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base"
          />
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Target Role</label>
          <input
            type="text"
            placeholder="e.g., Engineering Manager"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base"
          />
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">Years of Experience</label>
          <input
            type="number"
            placeholder="e.g., 5"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base"
          />
        </div>

        <button
          type="button"
          disabled
          className="w-full py-md px-lg bg-surface-container text-on-surface-variant rounded-lg cursor-not-allowed font-bold"
        >
          Generate Career Roadmap
        </button>
      </div>
    </div>
  );
};

export default CareerAssistant;
