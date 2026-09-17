# Changelog

## 2026-06-16

### Security

- Updated vulnerable dependency versions and transitive overrides so `bun audit`
  reports no known vulnerabilities.
- Added confirmation before retrying CORS-blocked REST requests through the Fetchx
  proxy when credential-like headers, query parameters, or body fields are
  present.
- Tightened browser-block detection so proxy fallback only runs for explicit CORS
  errors.
- Preserved structured Fetchx service error messages for API resource-limit
  failures.
- Increased the minimum pincode length for newly configured sensitive variables
  while preserving unlock compatibility for existing encrypted values.
- Expanded sensitive-value redaction to cover raw, URL-encoded, form-encoded,
  and base64 variants.
- Limited service worker caching to same-origin app shell and static assets.
