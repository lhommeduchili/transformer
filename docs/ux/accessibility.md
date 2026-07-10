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

## Visual System Requirements

The visual direction is documented in `docs/ux/visual-design.md`. Visual polish must preserve:

- Keyboard reachability for import, setup controls, queue actions, disclosures, and report actions.
- Visible focus states, including controls that use inversion instead of outlines.
- Accessible progress announcements for the ASCII queue meter.
- Assistive-technology discoverability for rejected files and errors.
- Reduced-motion behavior for signature and spinner animation.

## Phase 11 Release Checks

- Verify keyboard-only focus reaches import, preset, output, queue, and report controls.
- Verify disabled queue/report actions include visible guidance.
- Verify errors are announced through alert semantics.
- Verify queue progress is exposed through a status region.
