# Testing Standards

## Required Test Types

- Unit tests for domain policies, value objects, validators, queue transitions, filename sanitization, compatibility checks, and error classification.
- Integration tests for use cases, queue orchestration, worker protocol adapters, file writer adapters, and report generation.
- End-to-end tests for import, preset selection, output selection, conversion, pause/resume/cancel/retry, errors, and reporting.
- Accessibility tests for keyboard navigation, focus management, progress announcements, error surfacing, and non-pointer alternatives.
- Architecture tests for forbidden dependencies.

## Test Rules

- Test behavior, not implementation details.
- Keep domain tests fast and deterministic.
- Mock infrastructure ports at the application layer.
- Do not require real audio conversion for most tests.
- Use small fixture files for integration tests.
- Add stress tests for large queue behavior before production readiness.

## Quality Gates

Every feature should pass:

- Typecheck
- Lint
- Unit tests
- Relevant integration tests
- Architecture boundary checks
- Relevant E2E tests
