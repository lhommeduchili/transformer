# Testing Strategy

## Unit Tests

Use Vitest.

Cover:

- Filename sanitization.
- Compatibility validation.
- Preset validation.
- Queue state transitions.
- Retry eligibility.
- Error classification.
- Progress aggregation.
- Domain event generation.

## Integration Tests

Cover:

- Import to queue creation.
- Preset application to conversion plans.
- Queue orchestration with mocked conversion ports.
- Worker message handling.
- Report generation.
- File writer behavior with mocked browser APIs.

## Worker Tests

Cover:

- Worker command protocol.
- Cancellation behavior.
- Progress event parsing.
- Error serialization.
- Cleanup calls where observable.

## E2E Tests

Use Playwright.

Cover:

- Import files.
- Select preset.
- Choose output destination through mocked browser capability.
- Start conversion.
- Pause and resume queue.
- Cancel job.
- Retry failed job.
- View report.
- Keyboard navigation.
- Error boundary behavior.

## Accessibility Tests

Use Playwright plus axe-core.

Cover:

- Keyboard alternatives for import.
- Progress announcements.
- Error regions.
- Focus management.
- Accessible labels.

## Architecture Tests

Add static checks for forbidden imports.

Examples:

- Domain cannot import React.
- Domain cannot import infrastructure.
- Application cannot import UI.
- UI cannot import FFmpeg adapter directly.
