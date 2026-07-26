# Contributing to Resume ATS Analyzer

Thank you for your interest in contributing to Resume ATS Analyzer! This project helps job seekers optimize their resumes using AI-powered analysis. Every contribution makes this tool better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Questions & Support](#questions--support)

---

## Code of Conduct

This project follows a Code of Conduct to ensure a welcoming and inclusive environment for all contributors.

### Our Standards

**Positive behaviors:**
- Using welcoming and inclusive language
- Being respectful of different viewpoints and experiences
- Accepting constructive criticism gracefully
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behaviors:**
- Harassment, trolling, or derogatory comments
- Personal or political attacks
- Publishing others' private information without permission
- Any conduct that could reasonably be considered unprofessional

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **MongoDB** v6.0+ ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/downloads))
- **Code Editor** (VS Code recommended)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Setting Up Development Environment

1. **Fork the repository**
   - Click the 'Fork' button on GitHub to create your copy

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/resume-ats-analyzer.git
   cd resume-ats-analyzer
   ```

3. **Add upstream remote** (to stay updated with original repo)
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/resume-ats-analyzer.git
   ```

4. **Install dependencies**
   ```bash
   # Backend dependencies
   cd server
   npm install

   # Frontend dependencies
   cd ../client
   npm install
   ```

5. **Set up environment variables**
   
   **Backend** (`server/.env`):
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your values:
   # - MONGO_URI (your MongoDB connection string)
   # - JWT_SECRET (random secure string)
   # - GEMINI_API_KEY (your Google Gemini API key)
   ```

   **Frontend** (`client/.env`):
   ```bash
   cp client/.env.example client/.env
   # Edit client/.env with:
   # - VITE_API_BASE_URL=http://localhost:5000/api
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Backend (port 5000)
   cd server
   npm run dev

   # Terminal 2 - Frontend (port 3002)
   cd client
   npm run dev
   ```

7. **Verify setup**
   - Open browser to `http://localhost:3002`
   - Register a new account
   - Upload a test resume to verify everything works

---

## How Can I Contribute?

### Reporting Bugs 🐛

Before creating a bug report, please:
1. Check [existing issues](https://github.com/ORIGINAL_OWNER/resume-ats-analyzer/issues) to avoid duplicates
2. Update to the latest version to see if the bug persists

**Bug Report Template:**
```markdown
**Bug Description**
Clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Upload file '...'
4. See error

**Expected Behavior**
What should have happened.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, attach screenshots.

**Environment:**
- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
- Node.js: [e.g., v18.17.0]
- Browser: [e.g., Chrome 120, Firefox 121]
- MongoDB: [e.g., v6.0]

**Console Errors**
Paste any error messages from browser console or terminal.

**Additional Context**
Any other relevant information.
```

### Suggesting Features ✨

We welcome feature suggestions! Please include:
- **Clear title** describing the feature
- **Problem statement** - what problem does this solve?
- **Proposed solution** - how should it work?
- **Use cases** - who would benefit and how?
- **Mockups/examples** (optional but helpful)

**Example Feature Request:**
```markdown
**Feature**: Resume Template Library

**Problem**: Users struggle to format their resumes properly.

**Solution**: Provide 5-10 pre-designed ATS-friendly resume templates.

**Use Cases**: 
- New graduates can quickly create professional resumes
- Career changers can adapt templates for their field

**Mockups**: [Attach images or wireframes]
```

### Your First Code Contribution 🎯

New to the project? Look for issues labeled:
- `good first issue` - Perfect for newcomers
- `help wanted` - Community help needed
- `documentation` - Help improve docs

**First-time contributor workflow:**
1. Comment on the issue expressing interest
2. Wait for maintainer to assign you
3. Ask questions if anything is unclear
4. Submit your PR when ready

---

## Development Workflow

### Branch Naming Conventions

Use descriptive, hyphenated branch names:

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-resume-templates` |
| Bug Fix | `bugfix/description` | `bugfix/fix-upload-validation` |
| Hotfix | `hotfix/description` | `hotfix/security-patch` |
| Docs | `docs/description` | `docs/update-api-guide` |
| Refactor | `refactor/description` | `refactor/improve-auth-flow` |
| Test | `test/description` | `test/add-resume-upload-tests` |

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write clean code**
   - Follow existing code patterns
   - Add comments for complex logic
   - Keep functions small and focused (< 50 lines ideally)
   - Use meaningful variable names

3. **Test your changes**
   ```bash
   # Backend tests
   cd server
   npm test

   # Frontend tests
   cd client
   npm test

   # Manual testing
   # Start both servers and test in browser
   ```

4. **Commit frequently**
   ```bash
   git add .
   git commit -m "feat: add resume template selection"
   ```

5. **Stay up-to-date with main**
   ```bash
   git fetch upstream
   git rebase upstream/main
   # Resolve any conflicts
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## Style Guidelines

### JavaScript/React Best Practices

**General Principles:**
- Use ES6+ features (const/let, arrow functions, destructuring)
- Prefer `const` by default, `let` only when reassignment needed
- Never use `var`
- Use async/await over Promise chains
- Handle errors gracefully with try-catch
- Always validate user input

**Good Example:**
```javascript
// Clean, readable, handles errors
const calculateATSScore = async (resumeText, keywords) => {
  if (!resumeText || !Array.isArray(keywords)) {
    throw new Error('Invalid input: resume text and keywords array required');
  }

  try {
    const matchedKeywords = keywords.filter(keyword => 
      resumeText.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const score = Math.min((matchedKeywords.length / keywords.length) * 100, 100);
    return Math.round(score);
  } catch (error) {
    console.error('Error calculating ATS score:', error);
    throw error;
  }
};
```

**Bad Example:**
```javascript
// Avoid: unclear naming, no error handling, uses var
var calc = function(txt, arr) {
  var cnt = 0;
  for(var i=0; i<arr.length; i++) {
    if(txt.includes(arr[i])) cnt++;
  }
  return (cnt/arr.length)*100;
}
```

### CSS/Tailwind Guidelines

**Material Design 3 Principles:**
- Use MD3 color tokens: `bg-primary`, `text-on-surface`, `border-outline`
- Follow spacing scale: `gap-xs`, `gap-sm`, `gap-md`, `gap-lg`, `gap-xl`
- Use proper elevation: `shadow-sm`, `shadow-md`, `shadow-lg`
- Responsive design: Always test mobile, tablet, and desktop

**Class Organization:**
```javascript
// Group related utilities for readability
className="
  flex items-center justify-between gap-md
  p-lg rounded-xl
  bg-surface-container-lowest
  border-2 border-outline
  hover:border-primary hover:shadow-md
  transition-all duration-300
"
```

### File Organization

```
project-root/
├── client/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # Basic UI elements (Button, Card, etc.)
│   │   │   └── dashboard/   # Feature-specific components
│   │   ├── pages/           # Route-level components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API communication
│   │   ├── utils/           # Helper functions
│   │   ├── context/         # Global state (Auth, Theme, etc.)
│   │   └── layouts/         # Page layouts
│   
├── server/
│   ├── controllers/         # HTTP request handlers
│   ├── services/            # Business logic
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Auth, validation, error handling
│   ├── utils/               # Helper functions
│   └── config/              # Configuration files
```

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) for consistency and automated changelog generation.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(upload): add drag-and-drop resume upload` |
| `fix` | Bug fix | `fix(auth): resolve token expiration issue` |
| `docs` | Documentation only | `docs(readme): add API documentation` |
| `style` | Code formatting | `style: format code with prettier` |
| `refactor` | Code restructuring | `refactor(api): simplify error handling` |
| `perf` | Performance improvement | `perf(analysis): optimize ATS score calculation` |
| `test` | Adding tests | `test(auth): add login integration tests` |
| `chore` | Maintenance | `chore: update dependencies` |
| `ci` | CI/CD changes | `ci: add GitHub Actions workflow` |

### Examples

```bash
# Simple commit
feat: add resume template selection

# With scope
fix(upload): validate file size before upload

# With body and footer
feat(chat): implement AI resume chat feature

Add ChatGPT-style interface for users to ask questions
about their resume. Uses Gemini AI with RAG pipeline
for context-aware responses.

Closes #145
```

### Commit Guidelines

- ✅ Use present tense: "add feature" not "added feature"
- ✅ Use imperative mood: "move cursor to" not "moves cursor to"
- ✅ Limit first line to 72 characters
- ✅ Reference issues: `Closes #123`, `Fixes #456`, `Relates to #789`
- ✅ Explain *what* and *why*, not *how* (code shows how)

---

## Pull Request Process

### Before Submitting

Run through this checklist:

- [ ] Code follows the project's style guidelines
- [ ] Self-reviewed code for quality and clarity
- [ ] Added comments for complex or non-obvious code
- [ ] Updated documentation (README, API docs, etc.)
- [ ] No new warnings in console or terminal
- [ ] Added/updated tests for new functionality
- [ ] All tests pass (`npm test` in both client and server)
- [ ] Tested manually in browser (all major features work)
- [ ] Branch is up-to-date with upstream/main
- [ ] Commit messages follow Conventional Commits format

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open Pull Request** on GitHub from your branch to upstream/main

3. **Fill out PR template** completely (see below)

4. **Link related issues**
   - `Closes #123` - Automatically closes issue when PR merges
   - `Fixes #456` - Same as Closes
   - `Resolves #789` - Same as Closes  
   - `Related to #321` - References without closing

### Pull Request Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📝 Documentation update
- [ ] ♻️ Code refactoring
- [ ] ⚡ Performance improvement

## Motivation and Context
Why is this change needed? What problem does it solve?

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari)
- [ ] Tested responsive design (mobile, tablet, desktop)

**Test Environment:**
- OS: [e.g., Windows 11]
- Node.js: [e.g., v18.17.0]
- Browser: [e.g., Chrome 120]

## Screenshots (if applicable)
Add screenshots or screen recordings for UI changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented complex code
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
- [ ] I have checked my code for security vulnerabilities

## Related Issues
Closes #(issue number)

## Additional Notes
Any additional information reviewers should know.
```

### Review Process

1. **Automated checks** run (linting, tests, build)
2. **Code review** by at least one maintainer
3. **Address feedback** - push new commits if changes requested
4. **Re-review** if significant changes made
5. **Approval** from maintainer(s)
6. **Merge** by maintainer (usually squash and merge)

### After Merge

Clean up your branches:
```bash
# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name

# Update your main branch
git checkout main
git pull upstream main
```

---

## Testing Guidelines

### Test Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Critical paths (auth, upload, analysis) | 90%+ |
| Services and utilities | 80%+ |
| UI components | 70%+ |
| Overall project | 75%+ |

### Running Tests

```bash
# Backend tests
cd server
npm test

# Backend tests with coverage
npm run test:coverage

# Frontend tests
cd client
npm test

# Frontend tests with coverage
npm run test:coverage

# Watch mode (auto-rerun on file changes)
npm run test:watch
```

---

## Questions & Support

### Getting Help

- 💬 **GitHub Discussions**: Ask questions, share ideas
- 🐛 **Issues**: Report bugs or request features
- 📧 **Email**: For sensitive matters, contact project maintainers

### Useful Resources

- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Material Design 3](https://m3.material.io/)
- [Google Gemini AI](https://ai.google.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Recognition

Contributors are recognized in:
- 🏆 README Contributors section
- 📝 Release notes for each version
- 💎 Special shoutouts for significant contributions

---

## License

By contributing to Resume ATS Analyzer, you agree that your contributions will be licensed under the MIT License.

---

## Thank You! 🙏

Your contributions make Resume ATS Analyzer better for job seekers everywhere. Whether it's code, documentation, bug reports, or feature ideas - every contribution matters!

**Happy Coding!** 🚀
