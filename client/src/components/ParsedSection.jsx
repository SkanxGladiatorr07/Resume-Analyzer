/**
 * ParsedSection Component
 * Reusable component for displaying parsed resume sections
 * 
 * @param {string} title - Section title
 * @param {React.ReactNode} children - Section content
 * @param {React.ReactNode} icon - Section icon (optional)
 */

export const ParsedSection = ({ title, children, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
        {icon && <div className="text-indigo-600">{icon}</div>}
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>

      {/* Section Content */}
      <div>{children}</div>
    </div>
  );
};

/**
 * Empty State Component
 * Shows when no data exists for a section
 */
export const EmptySection = ({ message = 'No data available' }) => {
  return (
    <div className="text-center py-8">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
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
      <p className="mt-2 text-sm text-gray-500">{message}</p>
    </div>
  );
};

/**
 * Contact Info Display
 */
export const ContactInfoDisplay = ({ contactInfo }) => {
  if (!contactInfo || (!contactInfo.name && !contactInfo.email && !contactInfo.phone && !contactInfo.linkedin && !contactInfo.github)) {
    return <EmptySection message="No contact information found" />;
  }

  return (
    <div className="space-y-3">
      {contactInfo.name && (
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span className="text-gray-900 font-medium">{contactInfo.name}</span>
        </div>
      )}

      {contactInfo.email && (
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <a href={`mailto:${contactInfo.email}`} className="text-indigo-600 hover:text-indigo-700">
            {contactInfo.email}
          </a>
        </div>
      )}

      {contactInfo.phone && (
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          <span className="text-gray-700">{contactInfo.phone}</span>
        </div>
      )}

      {contactInfo.linkedin && (
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
          </svg>
          <a href={contactInfo.linkedin.startsWith('http') ? contactInfo.linkedin : `https://${contactInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">
            LinkedIn Profile
          </a>
        </div>
      )}

      {contactInfo.github && (
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
          <a href={contactInfo.github.startsWith('http') ? contactInfo.github : `https://${contactInfo.github}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">
            GitHub Profile
          </a>
        </div>
      )}
    </div>
  );
};

/**
 * Skills Display
 */
export const SkillsDisplay = ({ skills }) => {
  if (!skills || skills.length === 0) {
    return <EmptySection message="No skills found" />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, index) => (
        <span
          key={index}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
        >
          {skill}
        </span>
      ))}
    </div>
  );
};

/**
 * Education Display
 */
export const EducationDisplay = ({ education }) => {
  if (!education || education.length === 0) {
    return <EmptySection message="No education information found" />;
  }

  return (
    <div className="space-y-4">
      {education.map((edu, index) => (
        <div key={index} className="border-l-4 border-indigo-500 pl-4">
          {edu.degree && (
            <h3 className="text-lg font-medium text-gray-900">{edu.degree}</h3>
          )}
          {edu.institution && (
            <p className="text-gray-700 mt-1">{edu.institution}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            {edu.year && <span>📅 {edu.year}</span>}
            {edu.location && <span>📍 {edu.location}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Experience Display
 */
export const ExperienceDisplay = ({ experience }) => {
  if (!experience || experience.length === 0) {
    return <EmptySection message="No work experience found" />;
  }

  return (
    <div className="space-y-6">
      {experience.map((exp, index) => (
        <div key={index} className="border-l-4 border-indigo-500 pl-4">
          {exp.title && (
            <h3 className="text-lg font-medium text-gray-900">{exp.title}</h3>
          )}
          {exp.company && (
            <p className="text-gray-700 font-medium mt-1">{exp.company}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            {exp.duration && <span>📅 {exp.duration}</span>}
            {exp.location && <span>📍 {exp.location}</span>}
          </div>
          {exp.description && exp.description.length > 0 && (
            <ul className="mt-3 space-y-1 list-disc list-inside text-gray-700">
              {exp.description.map((desc, descIndex) => (
                <li key={descIndex}>{desc}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Projects Display
 */
export const ProjectsDisplay = ({ projects }) => {
  if (!projects || projects.length === 0) {
    return <EmptySection message="No projects found" />;
  }

  return (
    <div className="space-y-6">
      {projects.map((project, index) => (
        <div key={index} className="border-l-4 border-indigo-500 pl-4">
          {project.name && (
            <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
          )}
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {project.technologies.map((tech, techIndex) => (
                <span
                  key={techIndex}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
          {project.description && project.description.length > 0 && (
            <ul className="mt-3 space-y-1 list-disc list-inside text-gray-700">
              {project.description.map((desc, descIndex) => (
                <li key={descIndex}>{desc}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Certifications Display
 */
export const CertificationsDisplay = ({ certifications }) => {
  if (!certifications || certifications.length === 0) {
    return <EmptySection message="No certifications found" />;
  }

  return (
    <div className="space-y-3">
      {certifications.map((cert, index) => (
        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <svg className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            {cert.name && (
              <p className="font-medium text-gray-900">{cert.name}</p>
            )}
            <div className="flex gap-3 mt-1 text-sm text-gray-500">
              {cert.issuer && <span>{cert.issuer}</span>}
              {cert.date && <span>• {cert.date}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Languages Display
 */
export const LanguagesDisplay = ({ languages }) => {
  if (!languages || languages.length === 0) {
    return <EmptySection message="No languages found" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {languages.map((lang, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium text-gray-900">{lang.language}</span>
          {lang.proficiency && (
            <span className="text-sm text-gray-600">{lang.proficiency}</span>
          )}
        </div>
      ))}
    </div>
  );
};
