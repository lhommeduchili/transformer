# ChatGPT Project Instructions

This repository is a local-first browser-based DJ audio preparation tool.

## Always Follow

- Read `.ai/global-architecture-principles.md` before code generation.
- Respect Domain, Application, Infrastructure, and UI layer boundaries.
- Keep domain logic framework-independent.
- Use ports/interfaces for browser APIs, FFmpeg.wasm, file access, logging, and report generation.
- Do not add server-side audio upload or storage paths.
- Prefer small, composable modules.
- Add tests and documentation updates with implementation changes.

## Do Not Do

- Do not put business logic in React components.
- Do not call FFmpeg directly from UI.
- Do not read all imported files into memory during import.
- Do not choose final branding, visual style, palette, or mood during architecture phases.
