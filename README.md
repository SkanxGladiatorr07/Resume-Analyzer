# ResumeAI

## Description

ResumeAI is a production-ready AI-powered Resume Analyzer built with the MERN stack. It helps users analyze and optimize their resumes using advanced AI technology to improve their job application success rate.

## Planned Features

- 📄 **Resume Upload & Parsing** - Support for multiple file formats (PDF, DOCX)
- 🤖 **AI-Powered Analysis** - Intelligent resume scoring and feedback
- 💡 **Smart Recommendations** - Personalized suggestions for improvement
- 📊 **ATS Compatibility Check** - Ensure resumes pass Applicant Tracking Systems
- 🎯 **Keyword Optimization** - Match job descriptions with resume content
- 📈 **Skills Gap Analysis** - Identify missing skills for target roles
- 🔐 **User Authentication** - Secure user accounts and data
- 📱 **Responsive Design** - Seamless experience across all devices
- 💾 **Resume History** - Save and track multiple resume versions
- 📤 **Export Options** - Download optimized resumes

## Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM

### AI & Additional Tools
- AI/ML integration (to be implemented)
- File parsing libraries
- Cloud storage integration

## Project Structure

```
Resume-Analyzer/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── assets/        # Static assets (images, icons)
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── layouts/       # Layout components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main App component
│   │   ├── main.jsx       # Application entry point
│   │   └── index.css      # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── server/                # Backend Node.js application
    ├── config/            # Configuration files
    ├── controllers/       # Route controllers
    ├── middleware/        # Custom middleware
    ├── models/            # Database models
    ├── routes/            # API routes
    ├── services/          # Business logic
    ├── utils/             # Utility functions
    ├── app.js             # Express app setup
    ├── server.js          # Server entry point
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SkanxGladiatorr07/Resume-Analyzer.git
cd Resume-Analyzer
```

2. Install frontend dependencies:
```bash
cd client
npm install
```

3. Install backend dependencies:
```bash
cd ../server
npm install
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```
The API will run on `http://localhost:5000`

2. Start the frontend development server:
```bash
cd client
npm run dev
```
The application will run on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (Protected)

### Resume Management
- `POST /api/resumes/upload` - Upload resume (Protected)
- `GET /api/resumes` - Get all user resumes (Protected)
- `DELETE /api/resumes/:id` - Delete resume (Protected)
- `GET /api/resumes/:id/raw-text` - Get extracted text (Protected) ⭐
- `GET /api/resumes/:id/parsed` - Get structured data (Protected) ⭐ NEW

> For detailed API documentation, see:
> - [RESUME_UPLOAD_IMPLEMENTATION.md](./RESUME_UPLOAD_IMPLEMENTATION.md)
> - [RESUME_PARSING_COMPLETE.md](./RESUME_PARSING_COMPLETE.md) ⭐
> - [STRUCTURED_PARSING_COMPLETE.md](./STRUCTURED_PARSING_COMPLETE.md) ⭐ NEW

## Development Status

🚀 **Project is actively under development**

- [x] Project structure created
- [x] Frontend setup with React + Vite + Tailwind
- [x] Backend setup with Node.js + Express
- [x] MongoDB connection
- [x] User authentication (JWT-based)
- [x] Protected routes (Frontend & Backend)
- [x] Resume upload functionality (PDF & DOCX)
- [x] File validation & size limits
- [x] Secure file storage
- [x] Frontend upload UI with drag-and-drop
- [x] Resume list display and management
- [x] Delete resume functionality
- [x] **Resume parsing & text extraction (PDF & DOCX)** ⭐
- [x] **Structured data parsing (no AI)** ⭐ NEW
  - Contact information (name, email, phone, LinkedIn, GitHub)
  - Skills extraction
  - Education history
  - Work experience
  - Projects
  - Certifications
  - Languages
- [ ] Frontend UI for parsed data display
- [ ] AI analysis integration
- [ ] ATS compatibility scoring
- [ ] Analysis results display
- [ ] Dashboard enhancements

## Contributing

This is a personal project. Contributions, issues, and feature requests are welcome!

## License

ISC

## Author

**Skan**
- GitHub: [@SkanxGladiatorr07](https://github.com/SkanxGladiatorr07)
- Email: anirudhvshenoy07@gmail.com

---

Built with ❤️ using the MERN stack
