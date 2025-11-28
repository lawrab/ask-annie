# Security Policy

## Supported Versions

Currently supported versions for security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Annie's Health Journal seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Disclose Publicly

Please **do not** create a public GitHub issue for security vulnerabilities.

### 2. Report Privately

Send details to: **security@annies-health-journal.app** (or open a private security advisory on GitHub)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### 3. Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-90 days

### 4. Disclosure Policy

- We will acknowledge your report within 48 hours
- We will keep you updated on our progress
- We will credit you in the security advisory (unless you prefer anonymity)
- We request you do not disclose the vulnerability publicly until we've issued a fix

## Security Measures

### Current Implementation

- **Authentication**: JWT tokens with secure HTTP-only cookies
- **Password Security**: bcrypt hashing with salt rounds
- **API Security**: Rate limiting, CORS, Helmet.js headers
- **Input Validation**: Joi schema validation on all endpoints
- **Database Security**: Parameterised queries to prevent injection
- **File Upload**: MIME type validation, size limits, temporary storage
- **HTTPS**: Enforced in production
- **Environment Variables**: Sensitive data stored securely

### Planned Enhancements

- Two-factor authentication
- Security headers audit
- Penetration testing
- Automated dependency vulnerability scanning
- Regular security audits

## Known Security Considerations

### Voice Data Privacy

- Audio files are deleted immediately after transcription
- Transcripts are stored securely in MongoDB
- No third-party services receive raw audio (except optional OpenAI fallback)
- Users can export and delete all data

### Data Retention

- User data retained until account deletion
- Logs rotated and deleted after 30 days
- Temporary files cleaned up automatically

### Third-Party Dependencies

We regularly audit and update dependencies:
```bash
npm audit
npm audit fix
```

## Security Best Practices for Contributors

When contributing code:

1. **Never commit secrets** (API keys, passwords, tokens)
2. **Use environment variables** for all sensitive configuration
3. **Validate all inputs** server-side
4. **Sanitise user-generated content** before rendering
5. **Use HTTPS** for all external API calls
6. **Follow principle of least privilege** for database access
7. **Review dependencies** before adding new packages
8. **Write security tests** for authentication/authorisation logic

## Security Checklist for Deployment

Before deploying to production:

- [ ] All environment variables set securely
- [ ] HTTPS enabled and enforced
- [ ] Strong JWT secret generated
- [ ] Database access restricted by IP (if possible)
- [ ] CORS origins set restrictively (no wildcards)
- [ ] Rate limiting configured
- [ ] File upload limits enforced
- [ ] Logging enabled (but no sensitive data logged)
- [ ] Dependencies up to date
- [ ] Security headers configured (Helmet.js)
- [ ] MongoDB authentication enabled
- [ ] Backup strategy in place

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Issue triaged and confirmed
3. **Day 3-14**: Fix developed and tested
4. **Day 14-21**: Fix deployed to production
5. **Day 21+**: Public disclosure (coordinated with reporter)

## Contact

For security concerns:
- **Email**: security@annies-health-journal.app
- **GitHub**: Private security advisory
- **PGP Key**: [If available]

## Acknowledgements

We will publicly thank security researchers who responsibly disclose vulnerabilities (unless they prefer to remain anonymous).

---

**Last Updated**: 2024-01-25
**Version**: 1.0
