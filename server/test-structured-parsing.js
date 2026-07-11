/**
 * Test script for structured parsing
 * Tests the parsing functions with sample resume text
 */

import * as parser from './services/resumeStructuredParser.js';

// Sample resume text
const sampleResumeText = `
John Doe

Software Engineer | john.doe@email.com | +1-234-567-8900
LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

PROFESSIONAL SUMMARY

Experienced Full Stack Developer with 5+ years of expertise in building scalable web applications.

SKILLS

JavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, Docker, Kubernetes, AWS, Git, REST APIs, GraphQL, HTML, CSS, Python, Django

EXPERIENCE

Senior Software Engineer - TechCorp Inc. - San Francisco, CA
January 2021 - Present
• Led development of microservices architecture serving 1M+ users
• Implemented CI/CD pipelines reducing deployment time by 60%
• Mentored team of 5 junior developers
• Built RESTful APIs using Node.js and Express

Software Developer - StartupXYZ - New York, NY
June 2019 - December 2020
• Developed responsive web applications with React and Redux
• Integrated third-party APIs and payment gateways
• Optimized database queries improving performance by 40%
• Participated in Agile development processes

EDUCATION

Bachelor of Science in Computer Science
University of California, Berkeley - Berkeley, CA
2015 - 2019

PROJECTS

E-Commerce Platform
Technologies: React, Node.js, MongoDB, Stripe
• Built a full-stack e-commerce application with payment integration
• Implemented user authentication and authorization
• Deployed on AWS with auto-scaling capabilities

Task Management App
Technologies: Vue.js, Firebase, Tailwind CSS
• Created a real-time collaborative task management tool
• Integrated Firebase Authentication and Firestore
• Responsive design for mobile and desktop

CERTIFICATIONS

AWS Certified Developer - Associate - Amazon Web Services - 2022
MongoDB Certified Developer - MongoDB Inc. - 2021

LANGUAGES

English - Native
Spanish - Professional
French - Conversational
`;

console.log('==================================================');
console.log('🧪 Testing Structured Resume Parser');
console.log('==================================================\n');

// Test full parsing
console.log('1️⃣  Testing Full Parse...\n');
const structuredData = parser.parseStructuredData(sampleResumeText);

console.log('📋 Parsed Data:');
console.log(JSON.stringify(structuredData, null, 2));

console.log('\n==================================================');
console.log('2️⃣  Testing Individual Parsers...\n');

// Test contact info
console.log('👤 Contact Info:');
const contactInfo = parser.parseContactInfo(sampleResumeText);
console.log(JSON.stringify(contactInfo, null, 2));

// Test skills
console.log('\n💻 Skills:');
const skills = parser.parseSkills(sampleResumeText);
console.log(`Found ${skills.length} skills:`, skills);

// Test education
console.log('\n🎓 Education:');
const education = parser.parseEducation(sampleResumeText);
console.log(JSON.stringify(education, null, 2));

// Test experience
console.log('\n💼 Experience:');
const experience = parser.parseExperience(sampleResumeText);
console.log(JSON.stringify(experience, null, 2));

// Test projects
console.log('\n🚀 Projects:');
const projects = parser.parseProjects(sampleResumeText);
console.log(JSON.stringify(projects, null, 2));

// Test certifications
console.log('\n📜 Certifications:');
const certifications = parser.parseCertifications(sampleResumeText);
console.log(JSON.stringify(certifications, null, 2));

// Test languages
console.log('\n🌐 Languages:');
const languages = parser.parseLanguages(sampleResumeText);
console.log(JSON.stringify(languages, null, 2));

// Validate
console.log('\n==================================================');
console.log('3️⃣  Validation...\n');
const isValid = parser.validateStructuredData(structuredData);
console.log(`✅ Valid structured data: ${isValid}`);

console.log('\n==================================================');
console.log('✅ Test Complete!');
console.log('==================================================');
