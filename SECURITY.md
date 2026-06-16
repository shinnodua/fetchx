# Security Policy

## Supported Versions

This project currently supports security fixes on the default branch.

## Reporting a Vulnerability

Please report security issues privately before opening a public issue. Use one
of these channels:

- GitHub Security Advisories, if available for this repository.
- Email the maintainer at: security@call3.dev

Include:

- Affected feature or file path.
- Reproduction steps.
- Expected and actual behavior.
- Impact assessment, if known.
- Browser, wallet, network, and backend API details when relevant.

Do not include private keys, seed phrases, production API keys, bearer tokens,
or other live secrets in a report. Use test accounts and redacted request data.

## Scope

In scope:

- Frontend code in this repository.
- REST request execution and CORS proxy fallback behavior.
- Sensitive environment variable encryption, unlocking, redaction, and storage.
- Wallet transaction request handling before the connected wallet prompts the
  user.
- Service worker cache behavior for this app.

Out of scope:

- Vulnerabilities in third-party wallets, browser extensions, RPC providers, or
  block explorers.
- Testnet or mainnet contracts that are not maintained by this project.
- Denial-of-service reports that require unrealistic traffic volumes.
- Reports that rely on a compromised browser, compromised device, or malicious
  installed extension unless the app materially worsens the impact.

## Backend API Note

This frontend may call a Call3 backend API through `VITE_API_URL_CALL3`.
Security findings for backend endpoints such as proxying, contract metadata
lookup, or bytecode decoding should clearly identify the endpoint and whether
the behavior is reproducible without modifying this frontend.

## Public Disclosure

Please allow a reasonable time for triage and remediation before public
disclosure. We will credit reporters when requested and appropriate.
