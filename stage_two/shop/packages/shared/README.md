# Shared

This package is reserved for cross-platform contracts that are genuinely shared.

Examples:

- API contracts
- types
- validation schemas
- constants
- utility functions that do not depend on the browser or server runtime

Avoid placing:

- React components
- Next.js-specific server modules
- database models
- browser-only APIs
- secrets
- native/mobile-only code
