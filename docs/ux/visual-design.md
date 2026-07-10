# Visual Design Direction

This document is the source of truth for the current product aesthetic. UI work should preserve these decisions unless a future explicit design decision replaces them.

## Product Mood

The app is a brutal, minimal, local audio workbench. It should feel like a precise tool for preparing music, not a generic SaaS dashboard.

Use:

- Void-black surfaces.
- Thin square borders.
- Dense but legible spacing.
- Lowercase labels.
- Terminal-style status language.
- Editorial contrast in the main title.
- Sparse motion that feels like machine feedback.

Avoid:

- Glassmorphism.
- Gradients as decoration.
- Rounded dashboard cards.
- Badge/chip-heavy admin UI.
- Marketing copy inside the workbench.
- Decorative icons that do not carry action or state.

## Color Roles

The palette is intentionally narrow:

- Void black: page, panels, drop zone, and most control backgrounds.
- Bone: primary text, key borders, primary action inversion.
- Phosphor green: local-machine signal, active progress, drag/focus state for the audio drop box, and live status.
- Crimson: destructive, failed, skipped, cancelled, or rejected states.
- Cyan: restrained secondary accent only. Do not use cyan as a generic focus rectangle or button outline.
- Silver: secondary metadata, counters, helper text, and inactive text.

Do not introduce new accent colors without updating this document.

## Typography

Use three typographic modes:

- Editorial serif for the `transformer` title.
- Terminal monospace for status, filenames, counters, queue rows, progress, buttons, selects, and compact operational text.
- System sans for regular body rhythm where needed.

Headings and labels should remain lowercase unless the content is a filename, preset name, browser/API name, or user-provided text.

## Layout Principles

- Keep the single-page workbench structure.
- Keep import and queue as the primary workflow surface.
- Keep setup controls visually secondary but immediately reachable.
- Collapsible detail panels should stay compact and text-first.
- Uploaded tracks live inside the audio/drop box.
- Track separators appear only between uploaded tracks, never after the heading or after the last row.
- Prefer direct information density over explanatory prose.

## Controls

- Primary buttons invert: bone background on void text, then void background on bone text for hover/focus.
- Secondary buttons invert to bone background on hover/focus.
- Do not add cyan outline rectangles to buttons.
- `x` and `clear` controls are text-only, compact, and subtle.
- `x` and `clear` controls turn crimson on hover/focus and should not show cyan outlines.
- Disabled controls remain visible but muted with clear adjacent guidance when needed.

## Import And Drop Zone

- The audio/drop box uses a normal square border.
- Hover, keyboard focus within, and active drag states use phosphor green border/background feedback.
- Do not replace the drop box with a cyan outline treatment.
- File import must remain available without drag and drop.

## Queue And Progress

- Use the ASCII global progress meter instead of a native filled progress bar.
- The ASCII meter should span the available queue width and end one character before the percentage.
- The empty track uses `░`; the filled track uses `█`.
- The meter is visual only; accessible progress text must remain available through the status region.
- Individual job rows should not use filled or native progress bars.
- Individual job rows use text status, percent, and an active spinner only while running.
- Inactive job status may use `·`.
- Active spinner frames should stay in the terminal/spinner family, for example `⠋`, `⠙`, `⠹`.
- Cancelled, cancelling, skipped, and failed job states use crimson.

## Motion

- Motion should communicate machine activity, not decoration.
- The signature cursor and queue spinner are acceptable baseline motion.
- Respect `prefers-reduced-motion`; animations should effectively stop for reduced-motion users.

## Accessibility Requirements

Visual polish must not weaken accessibility:

- Keep keyboard reachability for import, setup controls, queue actions, disclosures, report actions, and destructive actions.
- Keep visible focus states, even when they are implemented through inversion rather than outlines.
- Keep progress announced accessibly.
- Keep errors and rejected files discoverable by assistive technology.
- Keep automated axe checks passing.

## Review Checklist

Before accepting UI changes, verify:

- The brutal/minimal void-black workbench mood remains intact.
- No generic dashboard/glass/badge styling was introduced.
- Buttons and compact destructive actions follow the documented hover/focus rules.
- The drop zone keeps phosphor green interaction states.
- The queue keeps ASCII global progress and text/spinner job progress.
- Desktop and mobile layouts remain usable.
- Keyboard and screen-reader behavior are not regressed.
