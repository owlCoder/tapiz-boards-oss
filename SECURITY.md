# Security Policy

## Supported versions

Only the `main` branch is supported. There are no maintained release branches — always deploy from the latest `main`.

## Reporting a vulnerability

Please do not open a public issue for security vulnerabilities. Instead, use [GitHub's private security advisory feature](https://github.com/owlCoder/tapiz-boards-oss/security/advisories/new) for this repository.

Include:
- A description of the vulnerability and its impact.
- Steps to reproduce, if possible.
- Any suggested fix or mitigation.

We'll acknowledge reports as soon as possible and work with you on a fix before any public disclosure.

## Scope notes

This is a self-hosted application — you are responsible for securing your own deployment (database access, `AUTH_SECRET` secrecy, TLS on your public URL, and keeping dependencies up to date). Reports about missing hardening in a user's own deployment (rather than in the application code itself) are still welcome as suggestions but are not treated as vulnerabilities in this project.
