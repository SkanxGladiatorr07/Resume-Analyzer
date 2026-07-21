# Demo Seed Data

This directory contains realistic seed data for demonstrating ResumeAI features.

## Directory Structure

```
seed/
├── README.md              # This file
├── users.json             # Sample user accounts
├── resumes.json           # Sample resume metadata
├── analyses.json          # Sample ATS analysis results
├── job-descriptions.json  # Sample job postings
├── job-matches.json       # Sample job match results
├── chat-sessions.json     # Sample chat interactions
└── sample-resumes/        # Sample PDF/DOCX files (optional)
```

## Usage

### For Testing

1. **Manual Testing**: Use the credentials from `users.json` to log in
2. **API Testing**: Import data using provided MongoDB import scripts
3. **Demo Presentations**: Pre-populated data shows full functionality

### Import Data

```bash
# Navigate to server directory
cd server

# Run seed script (if implemented)
npm run seed

# Or manually import to MongoDB
mongoimport --db resumeai --collection users --file ../docs/assets/seed/users.json --jsonArray
mongoimport --db resumeai --collection resumes --file ../docs/assets/seed/resumes.json --jsonArray
mongoimport --db resumeai --collection analyses --file ../docs/assets/seed/analyses.json --jsonArray
```

## Data Overview

### Users (users.json)
- **Count**: 3 demo users
- **Purpose**: Pre-configured accounts for testing
- **Password**: All use "Demo123!" (already hashed with bcrypt)

### Resumes (resumes.json)
- **Count**: 6 sample resumes
- **Formats**: PDF and DOCX
- **Profiles**: Software Engineer, Product Manager, Data Scientist, Designer, Marketing, Sales

### Analyses (analyses.json)
- **Count**: 6 corresponding analyses
- **Scores**: Range from 65 to 92
- **Content**: Realistic strengths, weaknesses, and suggestions

### Job Descriptions (job-descriptions.json)
- **Count**: 8 job postings
- **Roles**: Various tech and business roles
- **Companies**: Fictional company names

### Job Matches (job-matches.json)
- **Count**: 10 match results
- **Scores**: Range from 68% to 94%
- **Analysis**: Matching skills, gaps, recommendations

### Chat Sessions (chat-sessions.json)
- **Count**: 4 sessions
- **Messages**: 15-20 messages per session
- **Topics**: Resume content, career advice, improvements

## Notes

- All data is fictional and for demonstration purposes only
- User passwords are pre-hashed with bcrypt
- ObjectIds are pre-generated for consistency
- Timestamps use ISO 8601 format
- All data follows the actual MongoDB schema

## Customization

To create your own seed data:

1. Follow the schema structure in each file
2. Generate new ObjectIds using MongoDB's ObjectId()
3. Ensure foreign key relationships are maintained
4. Hash passwords using bcrypt with 10 rounds
5. Use realistic but fictional data

## Security Note

⚠️ **Do not use this seed data in production!**

This data is for development and demo purposes only. Production systems should:
- Use strong, unique passwords
- Generate secure JWT secrets
- Implement proper user registration
- Follow all security best practices
