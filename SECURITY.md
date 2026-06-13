# Security Policy

## Supported Versions

We release security patches for the current `main` branch and the latest tagged release. Older versions are not supported unless explicitly stated.

| Version | Supported |
|---------|-----------|
| main    | ✅ |
| latest release | ✅ |
| older releases | ❌ |

## Reporting a Vulnerability

Please report security vulnerabilities privately to the maintainers:

- Email: security@opensin-code.org
- GitHub: Open a **private vulnerability report** via [GitHub Security Advisories](https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2/security/advisories/new)

Please include:
- A clear description of the vulnerability
- Steps to reproduce (or a proof-of-concept)
- The affected version(s) or commit range
- Potential impact

We aim to acknowledge reports within 48 hours and release a fix within 7 days for critical issues.

## Security Practices

- Dependencies are scanned for known CVEs via `npm audit` and `pnpm audit` in CI
- The repository runs the SIN-Code `ceo-audit` workflow on every PR and push to main
- Secrets are never committed to the repository; see `.env.example` for required environment variables
- The Docker image is built from a multi-stage Dockerfile with no build secrets in the final layer

## Disclosure Policy

We follow responsible disclosure. Once a fix is released, we will publish a GitHub Security Advisory and credit the reporter (unless they prefer to remain anonymous).
