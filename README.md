# ResumeAI - AI-Powered Resume Analysis Platform

<div align="center">

![ResumeAI Logo](./docs/assets/logo-placeholder.png)

**Transform your resume with intelligent AI analysis and optimization**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%3E%3D6.0-green)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Screenshots](#screenshots)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Overview](#api-overview)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)
- [Authors](#authors)

---

## 🎯 Introduction

**ResumeAI** is an intelligent resume analysis platform that leverages advanced AI technologies to help job seekers optimize their resumes for Applicant Tracking Systems (ATS) and specific job opportunities. Built with modern web technologies and powered by Google's Gemini AI, ResumeAI provides actionable insights to improve your chances of landing your dream job.

### Why ResumeAI?

- **ATS Optimization**: Analyze your resume against industry-standard ATS algorithms
- **AI-Powered Insights**: Get intelligent recommendations from Google Gemini AI
- **Job Matching**: Compare your resume against specific job descriptions
- **Career Assistant**: Access AI tools for resume rewriting, STAR method generation, and more
- **Interactive Chat**: Ask questions about your resume and get instant AI responses
- **Comprehensive Analytics**: Track your resume performance with detailed metrics and visualizations

---

## ✨ Features

### Core Features

#### 🔍 **Resume Upload & Parsing**
- Support for PDF and DOCX file formats (up to 5MB)
- Automatic text extraction and intelligent parsing
- Structured data extraction (contact info, experience, education, skills)
- Real-time upload progress tracking

#### 📊 **ATS Score Analysis**
- Comprehensive ATS compatibility scoring (0-100)
- Keyword density analysis
- Formatting and structure evaluation
- Section completeness assessment
- Actionable improvement recommendations

#### 🎯 **Job Description Matching**
- AI-powered resume-to-job comparison
- Match score calculation with detailed breakdowns
- Identify matching and missing skills
- Technical and soft skills gap analysis
- Personalized recommendations for improvement

#### 💬 **AI Resume Chat**
- Interactive chat interface with your resume
- Context-aware Q&A powered by vector embeddings
- Source attribution for AI responses
- Session management and history
- Multi-resume support


#### 🛠️ **Career Assistant Tools**
- **Resume Rewriter**: Optimize bullet points with different tones
- **STAR Generator**: Transform experiences into STAR format stories
- **Interview Questions**: Generate role-specific practice questions (Coming Soon)
- **Project Suggestions**: Get portfolio project ideas (Coming Soon)
- **Learning Roadmap**: Personalized skill development paths (Coming Soon)
- **Career Roadmap**: 5-year career trajectory planning (Coming Soon)

#### 📈 **Analytics Dashboard**
- Resume performance metrics and trends
- ATS score distribution charts
- Upload timeline visualization
- Skills distribution analysis
- Job match statistics
- Activity timeline tracking

#### 🔐 **User Management**
- Secure JWT-based authentication
- User profile management
- Password reset with email verification
- Multi-resume support per user
- Session persistence

---

## 📸 Screenshots

### Dashboard
![Dashboard Screenshot](./docs/screenshots/dashboard-placeholder.png)
*Overview of your resume analytics and recent activity*

### Resume Upload
![Upload Screenshot](./docs/screenshots/upload-placeholder.png)
*Drag-and-drop resume upload with real-time processing*

### ATS Analysis
![Analysis Screenshot](./docs/screenshots/analysis-placeholder.png)
*Comprehensive ATS score breakdown with recommendations*


### Job Matching
![Job Match Screenshot](./docs/screenshots/jobmatch-placeholder.png)
*AI-powered comparison between your resume and job descriptions*

### AI Chat
![Chat Screenshot](./docs/screenshots/chat-placeholder.png)
*Interactive chat interface for resume-related questions*

### Career Assistant
![Career Assistant Screenshot](./docs/screenshots/career-assistant-placeholder.png)
*Suite of AI tools for career development*

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18.x with Vite
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS with Material Design 3
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Markdown**: React Markdown
- **Icons**: Material Symbols

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: JavaScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **File Parsing**: pdf-parse, mammoth
- **Validation**: Express Validator
- **Security**: bcryptjs, helmet, express-rate-limit


### AI & Machine Learning
- **LLM**: Google Gemini AI (gemini-1.5-flash, gemini-1.5-pro)
- **Embeddings**: Google Generative AI Embeddings
- **Vector Database**: In-memory vector store with cosine similarity
- **Email Service**: Nodemailer with Gmail SMTP

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint
- **Environment**: dotenv

---

## 📁 Folder Structure

```
Resume ATS Analyzer/
├── client/                      # Frontend React application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── assets/              # Images, fonts, etc.
│   │   ├── components/          # Reusable React components
│   │   │   ├── dashboard/       # Dashboard-specific components
│   │   │   └── ui/              # UI components (Button, Card, etc.)
│   │   ├── context/             # React Context providers
│   │   │   └── AuthContext.jsx  # Authentication context
│   │   ├── hooks/               # Custom React hooks
│   │   ├── layouts/             # Layout components
│   │   ├── pages/               # Page components
│   │   │   ├── Analysis.jsx
│   │   │   ├── AnalyticsDashboard.jsx
│   │   │   ├── CareerAssistant.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── JobMatch.jsx
│   │   │   ├── JobMatchHistory.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ResumeChat.jsx
│   │   │   ├── ResumeDetails.jsx
│   │   │   └── Upload.jsx
│   │   ├── services/            # API service modules
│   │   ├── utils/               # Utility functions
│   │   ├── App.jsx              # Root component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment template
│   ├── package.json
│   ├── tailwind.config.js       # Tailwind configuration
│   └── vite.config.js           # Vite configuration
│
├── server/                      # Backend Node.js application
│   ├── config/                  # Configuration files
│   │   └── database.js          # MongoDB connection
│   ├── controllers/             # Route controllers
│   │   ├── analysisController.js
│   │   ├── authController.js
│   │   ├── careerController.js
│   │   ├── chatController.js
│   │   ├── dashboardController.js
│   │   ├── jobDescriptionController.js
│   │   ├── jobMatchController.js
│   │   └── resumeController.js
│   ├── middleware/              # Express middleware
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Global error handling
│   │   └── upload.js            # File upload handling
│   ├── models/                  # Mongoose models
│   │   ├── Analysis.js
│   │   ├── ChatMessage.js
│   │   ├── ChatSession.js
│   │   ├── JobDescription.js
│   │   ├── JobMatch.js
│   │   ├── Resume.js
│   │   └── User.js
│   ├── routes/                  # API routes
│   │   ├── analysis.js
│   │   ├── auth.js
│   │   ├── career.js
│   │   ├── chat.js
│   │   ├── dashboard.js
│   │   ├── jobDescription.js
│   │   ├── jobMatch.js
│   │   └── resume.js
│   ├── services/                # Business logic services
│   │   ├── aiService.js         # Gemini AI integration
│   │   ├── analysisService.js   # Resume analysis logic
│   │   ├── emailService.js      # Email notifications
│   │   ├── embeddingService.js  # Vector embeddings
│   │   ├── jobMatchService.js   # Job matching logic
│   │   └── parseService.js      # File parsing
│   ├── utils/                   # Utility functions
│   ├── uploads/                 # Uploaded files storage
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment template
│   ├── package.json
│   └── server.js                # Entry point
│
├── stitch-designs/              # UI design files from Stitch
├── docs/                        # Documentation
│   ├── assets/                  # Documentation assets
│   └── screenshots/             # Application screenshots
├── .gitignore
├── CHANGELOG.md                 # Version history
├── CONTRIBUTING.md              # Contribution guidelines
├── LICENSE                      # MIT License
└── README.md                    # This file
```

---

## 💻 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/resumeai.git
cd resumeai
```

### Step 2: Install Dependencies

#### Install Backend Dependencies
```bash
cd server
npm install
```

#### Install Frontend Dependencies
```bash
cd ../client
npm install
```

### Step 3: Configure Environment Variables

Create `.env` files in both `server` and `client` directories. See [Environment Variables](#environment-variables) section for details.

#### Backend (.env in server/)
```bash
cp .env.example .env
# Edit .env with your configuration
```

#### Frontend (.env in client/)
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Step 4: Set Up MongoDB

Ensure MongoDB is running on your system:

```bash
# Linux/macOS
sudo systemctl start mongod

# Windows (run as Administrator)
net start MongoDB
```

Or use MongoDB Atlas (cloud):
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and get your connection string
3. Update `MONGO_URI` in server/.env

---

## 🔐 Environment Variables

### Backend Environment Variables (server/.env)

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/resumeai
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/resumeai

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Google Gemini AI
GEMINI_API_KEY=your_google_gemini_api_key

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=ResumeAI <noreply@resumeai.com>

# Frontend URL (for CORS and email links)
CLIENT_URL=http://localhost:3002

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables (client/.env)

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000

# App Configuration
VITE_APP_NAME=ResumeAI
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true
```

### Getting API Keys

#### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in `GEMINI_API_KEY`

#### Gmail App Password (for email service)
1. Enable 2-Step Verification on your Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this password in `EMAIL_PASS`

---

## 🏃 Running the Project

### Development Mode

#### Option 1: Run Both Servers Concurrently (Recommended)

From the root directory:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

#### Option 2: Use Separate Terminals

**Backend Server:**
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

**Frontend Development Server:**
```bash
cd client
npm run dev
# App runs on http://localhost:3002
```

### Production Mode

#### Backend
```bash
cd server
NODE_ENV=production npm start
```

#### Frontend
```bash
cd client
npm run build
npm run preview
```

### Access the Application

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

### Default Test Credentials

For testing purposes (if seeded):
```
Email: test@resumeai.com
Password: Test123!
```

> ⚠️ **Note**: Change default credentials in production!

---

## 📡 API Overview

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Main API Endpoints

#### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| GET | `/me` | Get current user | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password/:token` | Reset password | No |

#### Resume Routes (`/api/resumes`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all user resumes | Yes |
| POST | `/upload` | Upload new resume | Yes |
| GET | `/:id` | Get resume by ID | Yes |
| PUT | `/:id` | Update resume | Yes |
| DELETE | `/:id` | Delete resume | Yes |
| GET | `/:id/download` | Download resume file | Yes |

#### Analysis Routes (`/api/analysis`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/analyze/:resumeId` | Analyze resume | Yes |
| GET | `/:resumeId` | Get analysis results | Yes |
| GET | `/:resumeId/history` | Get analysis history | Yes |

#### Job Match Routes (`/api/job-match`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/generate` | Generate job match | Yes |
| GET | `/history` | Get match history | Yes |
| GET | `/:id` | Get match details | Yes |
| DELETE | `/:id` | Delete match | Yes |


#### Chat Routes (`/api/chat`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/sessions` | Create chat session | Yes |
| GET | `/sessions` | Get all sessions | Yes |
| GET | `/sessions/:id` | Get session details | Yes |
| POST | `/sessions/:id/messages` | Send message | Yes |
| PUT | `/sessions/:id/title` | Update session title | Yes |
| DELETE | `/sessions/:id` | Delete session | Yes |

#### Dashboard Routes (`/api/dashboard`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/overview` | Get dashboard overview | Yes |
| GET | `/charts` | Get chart data | Yes |
| GET | `/activity` | Get recent activity | Yes |

#### Career Assistant Routes (`/api/career`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/rewrite` | Rewrite content | Yes |
| POST | `/star` | Generate STAR format | Yes |
| GET | `/config/rewrite` | Get rewrite config | Yes |
| GET | `/config/star` | Get STAR config | Yes |

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per window
- Exceeding limits returns `429 Too Many Requests`

---

## 🚧 Future Improvements

### Planned Features

#### High Priority
- [ ] **Multi-language Support**: Support for resumes in multiple languages
- [ ] **PDF Export**: Generate optimized PDFs from parsed resume data
- [ ] **Resume Templates**: Pre-built ATS-friendly templates
- [ ] **Chrome Extension**: Quick resume analysis from job boards
- [ ] **LinkedIn Integration**: Import profile data directly
- [ ] **Cover Letter Generator**: AI-powered cover letter creation
- [ ] **Interview Preparation**: Complete interview question generator
- [ ] **Video Resume Analysis**: Analyze video presentations

#### Medium Priority
- [ ] **Skill Assessment Tests**: Interactive skill verification
- [ ] **Resume Version Control**: Track changes over time
- [ ] **Collaborative Feedback**: Share resumes for peer review
- [ ] **Job Application Tracker**: Track applications and interviews
- [ ] **Salary Insights**: Market rate analysis
- [ ] **Company Research**: Automated company information
- [ ] **Network Analysis**: LinkedIn connection insights
- [ ] **Portfolio Integration**: Link to GitHub, Behance, etc.

#### Long Term
- [ ] **Mobile Applications**: iOS and Android apps
- [ ] **API Marketplace**: Third-party integrations
- [ ] **Enterprise Features**: Team accounts and admin dashboards
- [ ] **White-label Solution**: Customizable for recruitment agencies
- [ ] **Blockchain Verification**: Credential verification
- [ ] **AR Resume Viewer**: Augmented reality presentations
- [ ] **AI Mock Interviews**: Interactive interview practice
- [ ] **Career Coaching**: AI-powered career guidance

### Technical Improvements
- [ ] Implement comprehensive unit and integration tests
- [ ] Add end-to-end testing with Playwright/Cypress
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Implement Redis caching for improved performance
- [ ] Add WebSocket support for real-time updates
- [ ] Implement proper logging with Winston
- [ ] Add monitoring with Prometheus/Grafana
- [ ] Containerize with Docker and Docker Compose
- [ ] Set up Kubernetes deployment
- [ ] Implement GraphQL API alongside REST
- [ ] Add server-side rendering (SSR) support
- [ ] Optimize bundle size and lazy loading

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Quick Start for Contributors

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 ResumeAI Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👥 Authors

### Core Team

**Anirudh Sharma**
- Role: Lead Developer & Project Architect
- GitHub: [@anirudhsharma](https://github.com/yourusername)
- Email: anirudh@resumeai.com
- Institution: DJ Sanghvi College of Engineering

### Contributors

We appreciate all contributors who have helped make ResumeAI better! See the [Contributors](https://github.com/yourusername/resumeai/graphs/contributors) page for a full list.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for providing powerful AI capabilities
- **Material Design** for the beautiful UI components
- **MongoDB** for the robust database solution
- **React Community** for excellent tools and libraries
- **Open Source Community** for inspiration and support

---

## 📞 Support

### Getting Help

- 📖 **Documentation**: [Full Documentation](./docs)
- 💬 **Discord**: [Join our community](https://discord.gg/resumeai)
- 🐛 **Issue Tracker**: [GitHub Issues](https://github.com/yourusername/resumeai/issues)
- 📧 **Email**: support@resumeai.com

### FAQ

**Q: Is ResumeAI free to use?**  
A: Yes, the core features are free. Premium features may be added in the future.

**Q: How secure is my resume data?**  
A: All resumes are stored securely with encryption. We never share your data with third parties.

**Q: Can I delete my data?**  
A: Yes, you can delete your account and all associated data at any time.

**Q: Which resume formats are supported?**  
A: Currently PDF and DOCX formats are supported.

**Q: How accurate is the ATS score?**  
A: The ATS score is based on industry-standard algorithms and best practices, but individual ATS systems may vary.

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/resumeai&type=Date)](https://star-history.com/#yourusername/resumeai&Date)

---

<div align="center">

**Made with ❤️ by the ResumeAI Team**

[⬆ Back to Top](#resumeai---ai-powered-resume-analysis-platform)

</div>
