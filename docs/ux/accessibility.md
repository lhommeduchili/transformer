# Accessibility Requirements

## Required Patterns

- File import must work without drag and drop.
- Queue actions must be keyboard reachable.
- Progress must be announced accessibly.
- Errors must be discoverable by screen readers.
- Dialogs must manage focus on open and close.
- Destructive actions must require clear confirmation or undo where appropriate.

## Critical User Tasks

- Import files.
- Select preset.
- Choose output destination.
- Start conversion.
- Pause and resume queue.
- Cancel jobs.
- Retry failures.
- Read report.

Each critical task must be possible with keyboard-only interaction.

## Testing

- Automated axe checks in Playwright.
- Manual keyboard review.
- Screen-reader pattern review for live progress and errors.

## Phase 11 Release Checks

- Verify keyboard-only focus reaches import, preset, output, queue, and report controls.
- Verify disabled queue/report actions include visible guidance.
- Verify errors are announced through alert semantics.
- Verify queue progress is exposed through a status region.

## Non-Goals In Phase 0

- Final visual design.
- Final color palette.
- Brand voice.
