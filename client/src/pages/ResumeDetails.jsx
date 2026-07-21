/**
 * Resume Details Page
 * Displays parsed resume data in structured sections
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resumeService } from '../services';
import { LoadingSpinner, MaterialIcon } from '../components';

export const ResumeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [parsingStatus, setParsingStatus] = useState(null);

  useEffect(() => {
    fetchResumeData();
  }, [id]);

  const fetchResumeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await resumeService.getResumeParsedData(id);

      if (response.success) {
        setResumeData(response.data);
        setParsingStatus(response.data.parsingStatus);
      } else {
        setError(response.message || 'Failed to fetch resume data');
      }
    } catch (err) {
      console.error('Error fetching resume data:', err);
      
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message;

        if (status === 202) {
          // Parsing still in progress
          setParsingStatus(message.includes('processing') ? 'processing' : 'pending');
          setError(message || 'Resume is still being parsed. Please wait and refresh the page.');
        } else if (status === 422) {
          // Parsing failed
          setParsingStatus('failed');
          setError(message || 'Resume parsing failed. Please try re-uploading the file.');
        } else if (status === 403) {
          setError('You do not have permission to view this resume.');
        } else if (status === 404) {
          setError('Resume not found.');
        } else {
          setError(message || 'Failed to fetch resume data');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <LoadingSpinner />
          <p className="font-headline-md text-headline-md text-on-surface">Loading resume data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-lg">
        <div className="max-w-md mx-auto">
          <div className="bg-error-container border border-error rounded-xl p-xl text-center">
            <MaterialIcon className="text-[64px] text-error mb-md">error</MaterialIcon>
            <h2 className="font-headline-md text-headline-md text-on-error-container mb-md">Error Loading Resume</h2>
            <p className="font-body-base text-body-base text-on-error-container mb-xl">{error}</p>
            <div className="flex flex-col sm:flex-row gap-sm justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="border border-outline-variant hover:bg-surface-container-low px-lg py-sm rounded-lg font-bold flex items-center justify-center gap-xs transition-all active:scale-95"
              >
                <MaterialIcon className="text-sm">arrow_back</MaterialIcon>
                Back to Dashboard
              </button>
              {parsingStatus === 'pending' && (
                <button
                  onClick={fetchResumeData}
                  className="bg-primary hover:bg-primary-container text-on-primary px-lg py-sm rounded-lg font-bold flex items-center justify-center gap-xs transition-all active:scale-95"
                >
                  <MaterialIcon className="text-sm">refresh</MaterialIcon>
                  Refresh
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data
  if (!resumeData || !resumeData.structuredData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-lg">
        <div className="max-w-md mx-auto text-center">
          <MaterialIcon className="text-[64px] text-on-surface-variant mb-md">description</MaterialIcon>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md">No Resume Data</h3>
          <p className="font-body-base text-body-base text-on-surface-variant mb-xl">No parsed data available for this resume.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary hover:bg-primary-container text-on-primary px-lg py-sm rounded-lg font-bold flex items-center justify-center gap-xs transition-all active:scale-95 mx-auto"
          >
            <MaterialIcon className="text-sm">arrow_back</MaterialIcon>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { structuredData, originalName, wordCount } = resumeData;

  return (
    <div className="min-h-screen bg-surface">
      <main className="max-w-container-max mx-auto px-lg py-xl">
        {/* Header Actions & Meta */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-xl gap-md">
          <div className="flex items-center gap-md">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant"
            >
              <MaterialIcon>arrow_back</MaterialIcon>
            </button>
            <div>
              <h1 className="font-display-lg text-display-lg">Resume Details</h1>
              <div className="flex items-center gap-sm mt-xs">
                <span className="font-body-sm text-body-sm text-on-surface-variant">{originalName}</span>
                <span className="px-sm py-xs bg-secondary-container bg-opacity-10 text-on-secondary-container text-label-caps font-label-caps rounded-lg">Ready</span>
              </div>
            </div>
          </div>
          <div className="flex gap-sm flex-wrap">
            <button className="px-lg py-sm border border-outline text-primary font-label-caps rounded-lg hover:bg-surface-container-low transition-colors">
              Edit Content
            </button>
            <button className="px-lg py-sm bg-primary-container text-on-primary font-label-caps rounded-lg hover:opacity-90 transition-opacity">
              Export PDF
            </button>
          </div>
        </div>

        {/* Bento Grid Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          {/* Left Column: Personal & Skills */}
          <div className="md:col-span-4 flex flex-col gap-lg">
            {/* Profile Section */}
            <section className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
              <div className="flex items-center gap-md mb-md">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-fixed bg-primary-fixed flex items-center justify-center">
                  <MaterialIcon className="text-[40px] text-primary">person</MaterialIcon>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md">{structuredData.contactInfo?.name || 'Resume Owner'}</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {structuredData.contactInfo?.title || 'Professional'}
                  </p>
                </div>
              </div>
              <div className="space-y-sm">
                {structuredData.contactInfo?.email && (
                  <div className="flex items-center gap-sm text-on-surface-variant">
                    <MaterialIcon className="text-primary text-[18px]">email</MaterialIcon>
                    <span className="text-body-sm">{structuredData.contactInfo.email}</span>
                  </div>
                )}
                {structuredData.contactInfo?.phone && (
                  <div className="flex items-center gap-sm text-on-surface-variant">
                    <MaterialIcon className="text-primary text-[18px]">phone_iphone</MaterialIcon>
                    <span className="text-body-sm">{structuredData.contactInfo.phone}</span>
                  </div>
                )}
                {structuredData.contactInfo?.location && (
                  <div className="flex items-center gap-sm text-on-surface-variant">
                    <MaterialIcon className="text-primary text-[18px]">location_on</MaterialIcon>
                    <span className="text-body-sm">{structuredData.contactInfo.location}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Skills Section */}
            <section className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-md">
                <div className="flex items-center gap-sm">
                  <MaterialIcon className="text-primary">psychology</MaterialIcon>
                  <h3 className="font-headline-md text-headline-md">Skills</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-sm">
                {structuredData.skills && structuredData.skills.length > 0 ? (
                  structuredData.skills.map((skill, index) => (
                    <span key={index} className="px-md py-xs bg-surface-container text-on-surface-variant text-label-caps font-label-caps rounded-full border border-outline-variant">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="font-body-sm text-body-sm text-on-surface-variant italic">No skills listed</span>
                )}
              </div>
            </section>

            {/* Languages & Certs */}
            <section className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
              {structuredData.languages && structuredData.languages.length > 0 && (
                <div className="mb-lg">
                  <div className="flex items-center gap-sm mb-sm">
                    <MaterialIcon className="text-primary">translate</MaterialIcon>
                    <h3 className="font-headline-md text-headline-md">Languages</h3>
                  </div>
                  <ul className="space-y-sm">
                    {structuredData.languages.map((lang, index) => (
                      <li key={index} className="flex justify-between text-body-sm">
                        <span className="text-on-surface">{lang.language || lang}</span>
                        {lang.proficiency && <span className="text-on-surface-variant">{lang.proficiency}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {structuredData.certifications && structuredData.certifications.length > 0 && (
                <div>
                  <div className="flex items-center gap-sm mb-sm">
                    <MaterialIcon className="text-primary">verified</MaterialIcon>
                    <h3 className="font-headline-md text-headline-md">Certifications</h3>
                  </div>
                  <ul className="space-y-sm">
                    {structuredData.certifications.map((cert, index) => (
                      <li key={index} className="text-body-sm">
                        <div className="font-bold text-on-surface">{cert.name || cert}</div>
                        {cert.issuer && (
                          <div className="text-on-surface-variant">
                            {cert.issuer}{cert.date && ` • ${cert.date}`}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Experience, Education, Projects */}
          <div className="md:col-span-8 flex flex-col gap-lg">
            {/* Work Experience */}
            <section className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-lg">
                <div className="flex items-center gap-sm">
                  <MaterialIcon className="text-primary">work</MaterialIcon>
                  <h3 className="font-headline-md text-headline-md">Professional Experience</h3>
                </div>
              </div>
              <div className="relative pl-lg space-y-xl">
                {structuredData.experience && structuredData.experience.length > 0 ? (
                  structuredData.experience.map((exp, index) => (
                    <div key={index} className="relative">
                      <div className="absolute left-[-30px] top-2 w-3 h-3 bg-primary rounded-full border-2 border-surface"></div>
                      {index < structuredData.experience.length - 1 && (
                        <div className="absolute left-[-24px] top-5 bottom-[-32px] w-px bg-outline-variant"></div>
                      )}
                      <div className="flex flex-col md:flex-row md:justify-between items-start mb-xs">
                        <h4 className="font-bold text-on-surface">{exp.title || exp.position}</h4>
                        <span className="text-label-caps font-label-caps text-on-surface-variant px-sm py-xs bg-surface-container rounded">
                          {exp.startDate && exp.endDate ? `${exp.startDate} — ${exp.endDate}` : exp.duration || 'Duration not specified'}
                        </span>
                      </div>
                      <div className="text-primary font-bold text-body-sm mb-sm">{exp.company}</div>
                      {exp.description && (
                        <ul className="list-disc list-inside text-body-sm text-on-surface-variant space-y-sm">
                          {Array.isArray(exp.description) ? (
                            exp.description.map((item, i) => <li key={i}>{item}</li>)
                          ) : (
                            <li>{exp.description}</li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant italic">No experience listed</p>
                )}
              </div>
            </section>

            {/* Education */}
            <section className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
              <div className="flex items-center gap-sm mb-lg">
                <MaterialIcon className="text-primary">school</MaterialIcon>
                <h3 className="font-headline-md text-headline-md">Education</h3>
              </div>
              <div className="relative pl-lg space-y-lg">
                {structuredData.education && structuredData.education.length > 0 ? (
                  structuredData.education.map((edu, index) => (
                    <div key={index} className="relative">
                      <div className="absolute left-[-30px] top-2 w-3 h-3 bg-primary rounded-full border-2 border-surface"></div>
                      {index < structuredData.education.length - 1 && (
                        <div className="absolute left-[-24px] top-5 bottom-[-20px] w-px bg-outline-variant"></div>
                      )}
                      <div className="flex justify-between items-start mb-xs">
                        <h4 className="font-bold text-on-surface">{edu.degree}</h4>
                        <span className="text-label-caps font-label-caps text-on-surface-variant">
                          {edu.startYear && edu.endYear ? `${edu.startYear} — ${edu.endYear}` : edu.year || ''}
                        </span>
                      </div>
                      <div className="text-on-surface-variant text-body-sm">
                        {edu.school || edu.institution}{edu.gpa && ` • GPA ${edu.gpa}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant italic">No education listed</p>
                )}
              </div>
            </section>

            {/* Projects */}
            {structuredData.projects && structuredData.projects.length > 0 && (
              <section className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl shadow-sm">
                <div className="flex items-center gap-sm mb-lg">
                  <MaterialIcon className="text-primary">rocket_launch</MaterialIcon>
                  <h3 className="font-headline-md text-headline-md">Featured Projects</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  {structuredData.projects.map((project, index) => (
                    <div key={index} className="p-md border border-outline-variant rounded-lg hover:border-primary transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between mb-sm">
                        <h5 className="font-bold text-on-surface group-hover:text-primary">{project.name || project.title}</h5>
                        <MaterialIcon className="text-on-surface-variant text-[18px]">open_in_new</MaterialIcon>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">
                        {project.description || 'Project description not available'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="mt-xxl pt-xl border-t border-outline-variant">
          <div className="flex flex-col md:flex-row justify-between items-center gap-md opacity-60">
            <div className="flex items-center gap-sm font-label-caps text-label-caps text-on-surface-variant">
              <MaterialIcon className="text-[16px]">history</MaterialIcon>
              <span>Generated: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-sm font-label-caps text-label-caps text-on-surface-variant">
              <MaterialIcon className="text-[16px]">description</MaterialIcon>
              <span>Word Count: {wordCount || 'N/A'} words</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
