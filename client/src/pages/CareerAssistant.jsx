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
      const response = await resumeService.getResumes();
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

  const activeToolData = tools.find(t => t.id === activeTool);

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
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!selectedResume) {
      setError('Please select a resume first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await careerService.generateInterviewQuestions({
        resumeId: selectedResume,
        jobDescription: jobDescription.trim() || null,
      });

      if (response.success) {
        setResult(response.data);
        setSuccess('Interview questions generated successfully!');
      } else {
        setError(response.message || 'Failed to generate interview questions');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate interview questions. Please try again.');
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
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">
            Job Description (Optional)
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description to get more targeted interview questions..."
            rows={8}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={loading}
          />
          <p className="text-label-caps text-on-surface-variant mt-xs">
            Leave empty for general questions based on your resume
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !selectedResume}
          className="w-full py-md px-lg bg-primary text-on-primary rounded-lg hover:bg-primary-container disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed transition-colors font-bold"
        >
          {loading ? 'Generating Questions...' : 'Generate Interview Questions'}
        </button>
      </div>

      {/* Output Side */}
      <div>
        {result ? (
          <div className="space-y-lg">
            {/* Technical Questions */}
            {result.questions?.technical && result.questions.technical.length > 0 && (
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
                  <MaterialIcon className="text-primary">code</MaterialIcon>
                  Technical Questions
                </h3>
                <div className="space-y-sm">
                  {result.questions.technical
                    .sort((a, b) => {
                      // Sort: easy → medium → hard
                      const order = { easy: 0, medium: 1, hard: 2 };
                      return (order[a.difficulty] || 99) - (order[b.difficulty] || 99);
                    })
                    .map((question, index) => (
                    <div key={index} className="bg-surface-container-low p-md rounded-lg">
                      <div className="flex items-start gap-sm">
                        <span className="font-bold text-primary min-w-[24px]">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="text-body-base text-on-surface mb-xs">{question.question}</p>
                          {question.difficulty && (
                            <span className={`text-label-caps px-sm py-xs rounded font-bold ${
                              question.difficulty === 'easy' ? 'bg-green-600 text-white' :
                              question.difficulty === 'medium' ? 'bg-orange-500 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Behavioral Questions */}
            {result.questions?.behavioral && result.questions.behavioral.length > 0 && (
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
                  <MaterialIcon className="text-secondary">psychology</MaterialIcon>
                  Behavioral Questions
                </h3>
                <div className="space-y-sm">
                  {result.questions.behavioral.map((question, index) => (
                    <div key={index} className="bg-surface-container-low p-md rounded-lg">
                      <div className="flex items-start gap-sm">
                        <span className="font-bold text-secondary min-w-[24px]">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="text-body-base text-on-surface mb-xs">{question.question}</p>
                          {question.category && (
                            <span className="text-label-caps bg-secondary-container text-on-secondary-container px-sm py-xs rounded">
                              {question.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project-Based Questions */}
            {result.questions?.projectBased && result.questions.projectBased.length > 0 && (
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
                  <MaterialIcon className="text-tertiary">folder</MaterialIcon>
                  Project-Based Questions
                </h3>
                <div className="space-y-sm">
                  {result.questions.projectBased.map((question, index) => (
                    <div key={index} className="bg-surface-container-low p-md rounded-lg">
                      <div className="flex items-start gap-sm">
                        <span className="font-bold text-tertiary min-w-[24px]">{index + 1}.</span>
                        <p className="text-body-base text-on-surface flex-1">{question.question}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-Up Questions */}
            {result.questions?.followUp && result.questions.followUp.length > 0 && (
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
                  <MaterialIcon className="text-on-surface-variant">forum</MaterialIcon>
                  Follow-Up Questions
                </h3>
                <div className="space-y-sm">
                  {result.questions.followUp.map((question, index) => (
                    <div key={index} className="bg-surface-container-low p-md rounded-lg">
                      <div className="flex items-start gap-sm">
                        <span className="font-bold text-on-surface-variant min-w-[24px]">{index + 1}.</span>
                        <p className="text-body-base text-on-surface flex-1">{question.question}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-xl p-lg border border-dashed border-outline flex flex-col justify-center items-center text-center h-full">
            <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-md">
              <MaterialIcon className="text-primary text-3xl">work</MaterialIcon>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface">Interview Questions will appear here</h4>
            <p className="text-body-sm text-on-surface-variant mt-sm max-w-sm">
              Select a resume and optionally add a job description to generate personalized interview practice questions.
            </p>
          </div>
        )}
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
  const [existingSkills, setExistingSkills] = useState('');
  const [missingSkills, setMissingSkills] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!existingSkills.trim() && !missingSkills.trim()) {
      setError('Please provide at least your current skills or skills you want to learn');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Parse skills from comma-separated strings
      const existingSkillsArray = existingSkills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const missingSkillsArray = missingSkills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await careerService.getProjectSuggestions({
        existingSkills: existingSkillsArray,
        missingSkills: missingSkillsArray,
        careerGoal: careerGoal.trim() || null,
      });

      if (response.success) {
        setResult(response.data);
        setSuccess('Project suggestions generated successfully!');
      } else {
        setError(response.message || 'Failed to generate project suggestions');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate project suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    if (!difficulty) return 'bg-surface-container text-on-surface';
    const lower = difficulty.toLowerCase();
    if (lower.includes('beginner') || lower.includes('easy'))
      return 'bg-green-600 text-white';
    if (lower.includes('intermediate') || lower.includes('medium'))
      return 'bg-orange-500 text-white';
    if (lower.includes('advanced') || lower.includes('hard'))
      return 'bg-red-600 text-white';
    return 'bg-surface-container text-on-surface';
  };

  const getDifficultyLabel = (difficulty) => {
    if (!difficulty) return '';
    // Capitalize first letter of the difficulty word
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
      {/* Input Side */}
      <div className="space-y-lg">
        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">
            Current Skills
          </label>
          <textarea
            value={existingSkills}
            onChange={(e) => setExistingSkills(e.target.value)}
            placeholder="e.g., React, Node.js, MongoDB, Python, Git..."
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={loading}
          />
          <p className="text-label-caps text-on-surface-variant mt-xs">
            Comma-separated list of skills you already have
          </p>
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">
            Skills to Learn
          </label>
          <textarea
            value={missingSkills}
            onChange={(e) => setMissingSkills(e.target.value)}
            placeholder="e.g., TypeScript, Docker, AWS, GraphQL..."
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={loading}
          />
          <p className="text-label-caps text-on-surface-variant mt-xs">
            Comma-separated list of skills you want to develop
          </p>
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">
            Career Goal (Optional)
          </label>
          <input
            type="text"
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            placeholder="e.g., Full Stack Developer, Data Scientist..."
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || (!existingSkills.trim() && !missingSkills.trim())}
          className="w-full py-md px-lg bg-primary text-on-primary rounded-lg hover:bg-primary-container disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed transition-colors font-bold"
        >
          {loading ? 'Generating Projects...' : 'Get Project Suggestions'}
        </button>
      </div>

      {/* Output Side */}
      <div>
        {result ? (
          <div className="space-y-lg">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
              <MaterialIcon className="text-primary">rocket_launch</MaterialIcon>
              Project Suggestions
            </h3>
            {result.projects && result.projects.length > 0 ? (
              <div className="space-y-lg">
                {result.projects
                  .sort((a, b) => {
                    // Sort by difficulty: beginner → intermediate → advanced
                    const order = {
                      beginner: 0,
                      easy: 0,
                      intermediate: 1,
                      medium: 1,
                      advanced: 2,
                      hard: 2,
                    };
                    const aDiff = (a.difficulty || '').toLowerCase();
                    const bDiff = (b.difficulty || '').toLowerCase();
                    return (order[aDiff] || 99) - (order[bDiff] || 99);
                  })
                  .map((project, index) => (
                    <div
                      key={index}
                      className="bg-surface-container-low rounded-lg p-lg border border-outline-variant"
                    >
                      <div className="flex items-start justify-between gap-md mb-sm">
                        <h4 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-sm">
                          <span className="text-primary">{index + 1}.</span>
                          {project.name}
                        </h4>
                        {project.difficulty && (
                          <span
                            className={`text-label-caps px-sm py-xs rounded font-bold ${getDifficultyColor(
                              project.difficulty
                            )}`}
                          >
                            {getDifficultyLabel(project.difficulty)}
                          </span>
                        )}
                      </div>

                      <p className="text-body-base text-on-surface mb-md">{project.description}</p>

                      {project.skillsUsed && project.skillsUsed.length > 0 && (
                        <div className="mb-md">
                          <p className="text-label-caps text-on-surface-variant mb-xs">
                            Skills You'll Practice:
                          </p>
                          <div className="flex flex-wrap gap-xs">
                            {project.skillsUsed.map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-label-caps bg-primary-container text-on-primary-container px-sm py-xs rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {project.learningOutcomes && project.learningOutcomes.length > 0 && (
                        <div className="mb-md">
                          <p className="text-label-caps text-on-surface-variant mb-xs">
                            What You'll Learn:
                          </p>
                          <ul className="list-disc list-inside space-y-xs text-body-sm text-on-surface">
                            {project.learningOutcomes.map((outcome, idx) => (
                              <li key={idx}>{outcome}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {project.estimatedTime && (
                        <div className="flex items-center gap-sm text-body-sm text-on-surface-variant">
                          <MaterialIcon className="text-sm">schedule</MaterialIcon>
                          <span>Estimated: {project.estimatedTime}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-body-base text-on-surface-variant">No projects generated</p>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-xl p-lg border border-dashed border-outline flex flex-col justify-center items-center text-center h-full">
            <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-md">
              <MaterialIcon className="text-primary text-3xl">rocket_launch</MaterialIcon>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface">
              Project Suggestions will appear here
            </h4>
            <p className="text-body-sm text-on-surface-variant mt-sm max-w-sm">
              Enter your current skills and skills you want to learn to get personalized project
              suggestions for your portfolio.
            </p>
          </div>
        )}
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
  const [currentSkills, setCurrentSkills] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [timeframe, setTimeframe] = useState('6 months');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!targetRole.trim()) {
      setError('Please enter a target role');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Parse skills from comma-separated string
      const currentSkillsArray = currentSkills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await careerService.generateLearningRoadmap({
        currentSkills: currentSkillsArray,
        targetRole: targetRole.trim(),
        timeframe,
      });

      console.log('Learning Roadmap Response:', response);

      if (response.success && response.data) {
        setResult(response.data);
        setSuccess('Learning roadmap generated successfully!');
      } else {
        setError(response.message || 'Failed to generate learning roadmap');
      }
    } catch (err) {
      console.error('Learning Roadmap Error:', err);
      setError(err.message || 'Failed to generate learning roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
      {/* Input Side */}
      <div className="space-y-lg">
        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">
            Current Skills
          </label>
          <textarea
            value={currentSkills}
            onChange={(e) => setCurrentSkills(e.target.value)}
            placeholder="List your current skills (comma-separated)..."
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={loading}
          />
          <p className="text-label-caps text-on-surface-variant mt-xs">
            Leave empty if you're starting from scratch
          </p>
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">
            Target Role <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., DevOps Engineer, Data Scientist..."
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-body-sm font-body-sm text-on-surface-variant mb-xs">
            Timeframe
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-base focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={loading}
          >
            <option value="3 months">3 months</option>
            <option value="6 months">6 months</option>
            <option value="12 months">12 months</option>
            <option value="24 months">24 months</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !targetRole.trim()}
          className="w-full py-md px-lg bg-primary text-on-primary rounded-lg hover:bg-primary-container disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed transition-colors font-bold"
        >
          {loading ? 'Generating Roadmap...' : 'Generate Learning Roadmap'}
        </button>
      </div>

      {/* Output Side */}
      <div>
        {result ? (
          <div className="space-y-lg">
            {/* Overview */}
            {result.roadmap?.overview && (
              <div className="bg-primary-container/20 rounded-lg p-lg border border-primary-container">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
                  <MaterialIcon className="text-primary">info</MaterialIcon>
                  Overview
                </h3>
                <p className="text-body-base text-on-surface">{result.roadmap.overview}</p>
                {result.roadmap.estimatedTimeline && (
                  <div className="mt-md flex items-center gap-sm text-body-sm text-on-surface-variant">
                    <MaterialIcon className="text-sm">schedule</MaterialIcon>
                    <span>Timeline: {result.roadmap.estimatedTimeline}</span>
                  </div>
                )}
              </div>
            )}

            {/* Phases */}
            {result.roadmap?.phases && Array.isArray(result.roadmap.phases) && result.roadmap.phases.length > 0 ? (
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm">
                  <MaterialIcon className="text-primary">timeline</MaterialIcon>
                  Learning Phases
                </h3>
                <div className="space-y-md">
                  {result.roadmap.phases.map((phase, index) => (
                    <div
                      key={index}
                      className="bg-surface-container-low rounded-lg p-lg border border-outline-variant"
                    >
                      <div className="flex items-start gap-md mb-sm">
                        <div className="w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                            {phase.name || phase.phase || `Phase ${index + 1}`}
                          </h4>
                          {phase.duration && (
                            <p className="text-label-caps text-on-surface-variant mb-sm">
                              Duration: {phase.duration}
                            </p>
                          )}
                          {phase.description && (
                            <p className="text-body-base text-on-surface mb-md">
                              {phase.description}
                            </p>
                          )}

                          {/* Skills to Learn */}
                          {phase.skillsToLearn && Array.isArray(phase.skillsToLearn) && phase.skillsToLearn.length > 0 && (
                            <div className="mb-md">
                              <p className="text-label-caps text-on-surface-variant mb-xs">
                                Skills to Learn:
                              </p>
                              <div className="flex flex-wrap gap-xs">
                                {phase.skillsToLearn.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="text-label-caps bg-secondary-container text-on-secondary-container px-sm py-xs rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resources */}
                          {phase.resources && Array.isArray(phase.resources) && phase.resources.length > 0 && (
                            <div className="mb-md">
                              <p className="text-label-caps text-on-surface-variant mb-xs">
                                Recommended Resources:
                              </p>
                              <ul className="list-disc list-inside space-y-xs text-body-sm text-on-surface">
                                {phase.resources.map((resource, idx) => (
                                  <li key={idx}>
                                    {typeof resource === 'string' 
                                      ? resource 
                                      : (resource.title || resource.name || 'Resource')}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Milestones */}
                          {phase.milestones && Array.isArray(phase.milestones) && phase.milestones.length > 0 && (
                            <div>
                              <p className="text-label-caps text-on-surface-variant mb-xs">
                                Key Milestones:
                              </p>
                              <ul className="space-y-xs">
                                {phase.milestones.map((milestone, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-sm text-body-sm text-on-surface"
                                  >
                                    <MaterialIcon className="text-sm text-tertiary mt-xs">
                                      check_circle
                                    </MaterialIcon>
                                    <span>{milestone}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-lg p-lg text-center">
                <p className="text-body-base text-on-surface-variant">
                  Roadmap generated but no phases data available
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-xl p-lg border border-dashed border-outline flex flex-col justify-center items-center text-center h-full">
            <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-md">
              <MaterialIcon className="text-primary text-3xl">school</MaterialIcon>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface">
              Learning Roadmap will appear here
            </h4>
            <p className="text-body-sm text-on-surface-variant mt-sm max-w-sm">
              Enter your target role and current skills to get a personalized learning path with
              phases, milestones, and resources.
            </p>
          </div>
        )}
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
