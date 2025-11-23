# Contributing to Ask Annie

Thank you for considering contributing to Ask Annie! This document outlines the process for contributing to the project.

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and considerate in all interactions.

### Expected Behaviour

- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Unacceptable Behaviour

- Harassment, trolling, or discriminatory language
- Publishing others' private information
- Any conduct which could be considered inappropriate in a professional setting

---

## How to Contribute

### Reporting Bugs

**Before submitting a bug report**:
1. Check existing GitHub Issues to avoid duplicates
2. Verify the bug exists on the latest version
3. Collect relevant information (browser, OS, steps to reproduce)

**Submitting a bug report**:
1. Use the GitHub issue template
2. Provide a clear, descriptive title
3. Include steps to reproduce the bug
4. Describe expected vs actual behaviour
5. Add screenshots if applicable
6. Include error messages/logs

**Example**:
```markdown
### Bug Description
Voice recording fails on iOS Safari 17

### Steps to Reproduce
1. Open app on iPhone (iOS 17, Safari)
2. Navigate to Check-In page
3. Tap microphone button
4. Observe error message

### Expected Behaviour
Recording should start

### Actual Behaviour
Error: "MediaRecorder not supported"

### Environment
- Device: iPhone 14
- OS: iOS 17.2
- Browser: Safari 17.2
```

---

### Suggesting Features

**Before suggesting a feature**:
1. Check if it's already in the roadmap (see README.md)
2. Search existing GitHub Issues
3. Consider if it aligns with the project's goals

**Suggesting a feature**:
1. Open a GitHub Issue with `[Feature Request]` prefix
2. Describe the problem it solves
3. Propose a solution
4. Consider alternative approaches
5. Discuss potential drawbacks

**Example**:
```markdown
### Feature Request: Medication Tracking

**Problem**: Users need to correlate symptoms with medication changes

**Proposed Solution**:
Add a medication log feature where users can:
- Record medication name, dosage, time
- Tag check-ins with current medications
- View symptom trends overlaid with medication timeline

**Alternatives Considered**:
- Using the notes field (less structured)
- Third-party medication tracker integration

**Drawbacks**:
- Increases app complexity
- May require medical disclaimer
```

---

### Pull Request Process

#### 1. Fork and Clone

```bash
# Fork repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/ask-annie.git
cd ask-annie
```

#### 2. Create Branch

```bash
git checkout -b feature/your-feature-name

# Branch naming conventions:
# feature/feature-name  - New features
# fix/bug-description   - Bug fixes
# docs/description      - Documentation
# refactor/description  - Code refactoring
# test/description      - Test additions
```

#### 3. Make Changes

- Follow the code style guide (see below)
- Write/update tests for your changes
- Update documentation if needed
- Ensure all tests pass locally

#### 4. Commit Changes

**Commit message format**:
```
type(scope): brief description

Longer explanation if needed.

Fixes #123
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code restructuring (no functional change)
- `test`: Adding/updating tests
- `chore`: Build/tool changes

**Examples**:
```bash
git commit -m "feat(checkins): add voice recording retry mechanism"
git commit -m "fix(auth): resolve JWT expiry edge case"
git commit -m "docs(api): update checkin endpoint examples"
```

#### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then:
1. Go to GitHub and create Pull Request
2. Fill in the PR template
3. Link related issues
4. Request review from maintainers

#### 6. Code Review Process

- Maintainers will review within 3-5 days
- Address requested changes
- Push updates to same branch
- PR will be merged once approved

---

## Code Style Guide

### TypeScript

**General Rules**:
- Use TypeScript strict mode
- Avoid `any` type (use `unknown` if needed)
- Prefer interfaces over types for object shapes
- Use meaningful variable names

**Examples**:
```typescript
// ✅ Good
interface CheckInData {
  symptoms: Record<string, string | number | boolean>;
  timestamp: Date;
}

async function createCheckIn(data: CheckInData): Promise<CheckIn> {
  // ...
}

// ❌ Bad
function create(d: any) {
  // ...
}
```

### React

**Components**:
- Use functional components with hooks
- One component per file
- Export as named export
- Use TypeScript interfaces for props

```tsx
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}

// ❌ Bad
export default function({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>
}
```

**Hooks**:
- Place at top of component
- Use descriptive names
- Extract complex logic to custom hooks

```tsx
// ✅ Good
function useCheckIns() {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(false);

  // ...

  return { checkins, loading };
}

// Usage
const { checkins, loading } = useCheckIns();
```

### Styling (Tailwind)

- Use utility classes
- Extract repeated patterns to components
- Use custom classes in `index.css` for complex patterns

```tsx
// ✅ Good
<div className="rounded-lg bg-white p-6 shadow-md">
  <h2 className="text-2xl font-semibold text-gray-800">Title</h2>
</div>

// ✅ Also good (using custom class)
<div className="card">
  <h2 className="text-2xl font-semibold text-gray-800">Title</h2>
</div>
```

### File Structure

```
backend/
├── src/
│   ├── controllers/     # One file per resource (e.g., checkinController.ts)
│   ├── models/          # One file per model (e.g., CheckIn.ts)
│   ├── routes/          # One file per resource (e.g., checkinRoutes.ts)
│   ├── services/        # Business logic (e.g., transcriptionService.ts)
│   └── utils/           # Helper functions (e.g., logger.ts)

frontend/
├── src/
│   ├── components/      # Reusable components (e.g., Button.tsx)
│   ├── pages/           # Page components (e.g., Dashboard.tsx)
│   ├── hooks/           # Custom hooks (e.g., useAuth.ts)
│   ├── services/        # API calls (e.g., api.ts)
│   └── types/           # TypeScript types (e.g., index.ts)
```

---

## Testing Guidelines

### Test Coverage

Aim for:
- Backend: >80% coverage
- Frontend: >70% coverage
- Critical paths: 100% coverage

### Writing Tests

**Backend**:
```typescript
describe('CheckIn API', () => {
  it('should create check-in with valid data', async () => {
    const res = await request(app)
      .post('/api/checkins')
      .send(validCheckInData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('should reject invalid data', async () => {
    await request(app)
      .post('/api/checkins')
      .send({})
      .expect(400);
  });
});
```

**Frontend**:
```tsx
describe('Button Component', () => {
  it('renders with correct label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button label="Click" onClick={handleClick} />);

    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## Documentation

### Code Comments

**When to comment**:
- Complex algorithms or logic
- Non-obvious design decisions
- Workarounds for bugs/limitations

**When NOT to comment**:
- Obvious code (comments should explain "why", not "what")
- Outdated information (keep comments updated)

```typescript
// ✅ Good
// Use exponential backoff to avoid overwhelming the transcription service
// when processing large batches of audio files
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

// ❌ Bad
// Set delay variable
const delay = 1000;
```

### API Documentation

When adding/changing endpoints:
1. Update `docs/API_DOCUMENTATION.md`
2. Include request/response examples
3. Document all parameters and error codes

### README Updates

Update relevant README files when:
- Adding new dependencies
- Changing setup process
- Adding new scripts/commands
- Changing project structure

---

## Review Checklist

Before submitting PR, ensure:

- [ ] Code follows style guide
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Code is linted (`npm run lint`)
- [ ] TypeScript compiles without errors
- [ ] No console.log statements in production code
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with `main`
- [ ] PR description is clear and complete

---

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Chat**: Join our Discord (if available)
- **Email**: contact@ask-annie.app (if available)

---

## Recognition

Contributors will be recognised in:
- GitHub Contributors page
- Release notes (for significant contributions)
- CONTRIBUTORS.md file (for ongoing contributors)

---

## Licence

By contributing, you agree that your contributions will be licenced under the MIT Licence.

---

**Thank you for contributing to Ask Annie!** 🐰

Every contribution, no matter how small, helps make health tracking more accessible and empowering for everyone.

---

**Document Version**: 1.0
**Last Updated**: 2024-01-25
**Maintained By**: Development Team
