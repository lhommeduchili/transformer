# Quality Gates

## Local Development Gates

Before accepting implementation work, run the relevant gates:

- Format check.
- Typecheck.
- Lint.
- Unit tests.
- Integration tests.
- Architecture boundary checks.
- E2E tests for affected workflows.
- Accessibility checks for affected UI.

## Required CI Gates

CI jobs must run:

- Install dependencies.
- Format check.
- Typecheck.
- Lint.
- Unit tests.
- Integration tests.
- Architecture boundary checks.
- Playwright E2E smoke tests.

## Review Gates

Implementation work should not be accepted if it:

- Violates layer boundaries.
- Adds audio upload behavior.
- Adds business logic to UI components.
- Makes large batch workflows eagerly memory-bound.
- Lacks tests for changed domain or application behavior.
- Regresses keyboard or assistive technology access.
- Regresses the documented visual design baseline in `docs/ux/visual-design.md`.
