# Accessibility Rules

Accessibility is a product requirement.

## Required Behavior

- Every drag-and-drop interaction must have a keyboard-accessible alternative.
- Long-running progress must be perceivable without relying on color or animation.
- Errors must be screen-reader discoverable.
- Modal dialogs must manage focus.
- Tables or queue lists must support keyboard navigation and clear row actions.
- Controls must have accessible names.
- Disabled controls must explain why an action is unavailable where practical.

## Testing

- Run automated accessibility checks in E2E tests.
- Manually verify keyboard-only operation before release.
- Verify progress announcements and error regions with assistive technology patterns.

## Design

- Do not choose final branding, palette, or mood during Phase 0.
- Information architecture and interaction clarity come first.
