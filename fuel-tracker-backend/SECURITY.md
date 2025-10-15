# Security Best Practices

## Dependencies Audit

### Regular Checks

Regularly check dependencies for vulnerabilities:

```bash
# Python dependencies audit (recommended once a month)
pip list --outdated
pip-audit  # Requires installation: pip install pip-audit

# Docker image security scan
docker scan fuel-tracker-backend

# Trivy (alternative)
trivy image fuel-tracker-backend
```

### Automated Monitoring

It is recommended to set up automatic monitoring through:
- **GitHub Dependabot** (automatic PRs with updates)
- **Snyk** (vulnerability scanning)
- **PyUp** (Python-specific dependency monitoring)

### Critical Dependencies

Pay special attention to:
- **Django** - web framework (critical security updates)
- **psycopg2** - PostgreSQL driver
- **redis** - caching
- **djangorestframework** - API framework

### Update Policy

1.  **Security updates**: Apply immediately
2.  **Minor updates**: Test and apply monthly
3.  **Major updates**: Plan and test before applying

## Password Security

- Minimum length: 8 characters
- Django validators:
  - UserAttributeSimilarityValidator (not similar to email/username)
  - CommonPasswordValidator (not from the list of common passwords)
  - NumericPasswordValidator (not only numbers)

## Session Security

- Session lifetime: 1 hour (3600 seconds)
- HttpOnly cookies (XSS protection)
- SameSite=Lax (CSRF protection)
- Secure cookies in production (HTTPS only)

## Rate Limiting

- Authentication endpoints: 5 req/min
- Anonymous users: 100 req/hour
- Authenticated users: 1000 req/hour

## Account Lockout

- 5 failed login attempts → block for 15 minutes
- Logging of all failed attempts with IP addresses

## Input Validation

- XSS sanitization via `bleach` library
- Maximum length for all text fields
- Validation at the serializer and model levels

## Logging

- Correlation ID for all requests
- Request/Response logging (WITHOUT sensitive data)
- Security events in a separate log (`logs/security.log`)

## Production Checklist

- [ ] `DEBUG=False`
- [ ] Unique `SECRET_KEY` (>50 characters)
- [ ] `ALLOWED_HOSTS` are specified explicitly
- [ ] `CORS_ALLOWED_ORIGINS` whitelist
- [ ] SSL/HTTPS is configured
- [ ] Security headers (HSTS, CSP, X-Frame-Options)
- [ ] Database backups are configured
- [ ] Monitoring and alerting

## Incident Response

In case of a security incident:

1.  **Isolate**: Disable the affected service
2.  **Assess**: Determine the extent of the leak/compromise
3.  **Notify**: Users (if their data is affected)
4.  **Fix**: Apply a patch/fix
5.  **Document**: Post-mortem analysis
6.  **Prevent**: Update processes/tests

## Contact

Security issues: security@example.com