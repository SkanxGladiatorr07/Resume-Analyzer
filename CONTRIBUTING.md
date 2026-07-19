# Contributing to ResumeAI

First off, thank you for considering contributing to ResumeAI! It's people like you that make ResumeAI such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js (v18+)
- MongoDB (v6.0+)
- Git
- A code editor (VS Code recommended)
- Basic knowledge of React and Node.js

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Click the 'Fork' button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/resumeai.git
   cd resumeai
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/original/resumeai.git
   ```

4. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

5. **Set up environment variables**
   ```bash
   # Copy example env files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   # Edit with your configurations
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

**When creating a bug report, include:**
- **Clear and descriptive title**
- **Steps to reproduce** the behavior
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, Node version, browser, etc.)
- **Error messages** or console logs

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11, macOS 13, Ubuntu 22.04]
- Node.js version: [e.g., v18.17.0]
- Browser: [e.g., Chrome 120, Firefox 121]
- ResumeAI version: [e.g., 1.0.0]

**Additional context**
Any other context about the problem.
```

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:
- **Clear and descriptive title**
- **Detailed description** of the proposed feature
- **Use cases** - why this would be useful
- **Possible implementation** approach (optional)
- **Mockups or examples** (if applicable)

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `beginner friendly` - Easy to tackle

### Pull Requests

1. **Find or create an issue** for what you want to work on
2. **Comment on the issue** to let others know you're working on it
3. **Fork and create a branch** from `main`
4. **Make your changes** following our guidelines
5. **Test thoroughly** - ensure all tests pass
6. **Submit a pull request**

---

## Development Workflow

### Branch Naming Convention

Use descriptive branch names:
- `feature/add-resume-templates` - New features
- `bugfix/fix-upload-error` - Bug fixes
- `hotfix/security-patch` - Urgent fixes
- `docs/update-readme` - Documentation
- `refactor/improve-api-structure` - Code refactoring
- `test/add-unit-tests` - Testing

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing patterns and conventions
   - Add comments for complex logic
   - Keep functions small and focused

3. **Test your changes**
   ```bash
   # Run backend tests
   cd server
   npm test

   # Run frontend tests
   cd client
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add resume template feature"
   ```

5. **Keep your branch updated**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## Style Guidelines

### JavaScript Style Guide

We follow industry-standard JavaScript practices:

**General Rules:**
- Use ES6+ features (arrow functions, destructuring, etc.)
- Use `const` by default, `let` when reassignment is needed
- Avoid `var`
- Use meaningful variable and function names
- Keep functions pure when possible
- Handle errors gracefully

**Example:**
```javascript
// Good
const calculateATSScore = (resume, keywords) => {
  if (!resume || !keywords) {
    throw new Error('Invalid input');
  }
  
  const score = keywords.reduce((acc, keyword) => {
    return resume.includes(keyword) ? acc + 10 : acc;
  }, 0);
  
  return Math.min(score, 100);
};

// Bad
var calc = function(r, k) {
  var s = 0;
  for(var i=0; i<k.length; i++) {
    if(r.includes(k[i])) s += 10;
  }
  return s;
}
```


### React/JSX Style Guide

**Component Structure:**
```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComponentName } from '../components';

// 2. Component Definition
const MyComponent = ({ prop1, prop2 }) => {
  // 3. Hooks
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  
  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 5. Event Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 6. Render
  return (
    <div className="container">
      {/* JSX content */}
    </div>
  );
};

// 7. Export
export default MyComponent;
```

**JSX Guidelines:**
- Use self-closing tags when no children: `<Component />`
- Use double quotes for JSX attributes
- Use camelCase for event handlers: `onClick`, `onChange`
- Extract complex JSX into separate components
- Use fragments `<>` instead of unnecessary divs

### CSS/Tailwind Guidelines

- Use Tailwind utility classes consistently
- Follow Material Design 3 color tokens
- Use responsive modifiers: `md:`, `lg:`, `xl:`
- Group related utilities: `className="flex items-center gap-md"`
- Extract repeated patterns into components

### File Organization

**Backend:**
- Controllers: Handle HTTP requests/responses
- Services: Business logic and external integrations
- Models: Database schemas
- Routes: API endpoint definitions
- Middleware: Request processing
- Utils: Helper functions

**Frontend:**
- Components: Reusable UI components
- Pages: Route-level components
- Hooks: Custom React hooks
- Services: API calls
- Utils: Helper functions
- Context: Global state management

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
feat(auth): add password reset functionality

Implement forgot password and reset password endpoints
with email verification using JWT tokens.

Closes #123
```

```bash
fix(upload): resolve file size validation error

The file size check was incorrectly rejecting valid files.
Updated validation logic to properly handle file sizes.

Fixes #456
```

```bash
docs(readme): update installation instructions

Added clearer steps for MongoDB setup and environment
variable configuration.
```

### Commit Message Guidelines

- Use present tense: "add feature" not "added feature"
- Use imperative mood: "move cursor to" not "moves cursor to"
- Limit first line to 72 characters
- Reference issues and pull requests in the footer
- Explain **what** and **why**, not **how** (code shows how)

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex code
- [ ] Documentation updated (if needed)
- [ ] No new warnings generated
- [ ] Tests added/updated and passing
- [ ] All existing tests pass
- [ ] Branch is up to date with main

### Submitting a Pull Request

1. **Push your branch** to your fork on GitHub

2. **Open a Pull Request** from your branch to `main`

3. **Fill out the PR template** with all required information

4. **Link related issues** using keywords:
   - `Closes #123` - Closes the issue when PR is merged
   - `Fixes #456` - Same as Closes
   - `Resolves #789` - Same as Closes
   - `Related to #321` - References without closing

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] New and existing tests pass

## Screenshots (if applicable)
Add screenshots here.

## Related Issues
Closes #(issue number)
```

### Review Process

1. **Automated checks** must pass (linting, tests, build)
2. **Code review** by at least one maintainer
3. **Address feedback** and push new commits if needed
4. **Approval** from maintainer(s)
5. **Merge** by maintainer

### After Merge

- Delete your branch (both locally and on GitHub)
- Update your local repository:
  ```bash
  git checkout main
  git pull upstream main
  ```

---

## Testing Guidelines

### Writing Tests

**Backend Tests (Jest):**
```javascript
describe('Resume Service', () => {
  describe('calculateATSScore', () => {
    it('should return 0 for empty resume', () => {
      const score = calculateATSScore('', ['keyword']);
      expect(score).toBe(0);
    });

    it('should calculate correct score for matching keywords', () => {
      const resume = 'I have experience with React and Node.js';
      const keywords = ['React', 'Node.js'];
      const score = calculateATSScore(resume, keywords);
      expect(score).toBeGreaterThan(0);
    });
  });
});
```

**Frontend Tests (Vitest + React Testing Library):**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test Coverage

Aim for:
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user flows tested

---

## Community

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Join our community server
- **Stack Overflow**: Tag questions with `resumeai`

### Recognition

Contributors are recognized in:
- README.md Contributors section
- Release notes
- Annual contributor spotlight

### Core Contributor Guidelines

To become a core contributor:
1. Consistently contribute quality code
2. Help review pull requests
3. Participate in discussions
4. Mentor new contributors
5. Demonstrate commitment to the project

---

## License

By contributing to ResumeAI, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

Don't hesitate to ask! We're here to help:
- Open an issue for questions
- Join our Discord community
- Email: contributors@resumeai.com

---

**Thank you for contributing to ResumeAI! 🎉**
