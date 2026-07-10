# Product Requirements Document

## Product Summary

Build a browser-native DJ audio preparation tool that converts, validates, sanitizes, and reports on large music batches entirely on the user's device.

No audio files are uploaded to a server. Processing is local-first and powered by browser APIs, Web Workers, and FFmpeg.wasm.

## Goals

- Prepare music libraries for professional DJ software and hardware compatibility.
- Support batch workflows for hundreds or thousands of tracks.
- Give users clear visibility into progress, failures, warnings, and output results.
- Preserve privacy by keeping audio, filenames, metadata, logs, and reports local.
- Establish a maintainable product foundation that can evolve for years.

## Target Users

- Professional DJs preparing USB drives or Rekordbox libraries.
- Hobbyist DJs normalizing mixed-format collections.
- Music curators managing large archives.
- Event performers who need predictable file compatibility.

## Core User Problems

- DJ equipment can reject or mishandle files with unsupported codecs, containers, metadata, sample rates, or filenames.
- Desktop conversion tools are often opaque, heavy, or not optimized for DJ compatibility.
- Cloud converters are unacceptable for private or licensed music libraries.
- Batch failures are hard to audit and retry safely.

## Functional Requirements

- Drag-and-drop batch import of audio files.
- Folder import where browser support allows.
- Local audio conversion using FFmpeg.wasm.
- Configurable output presets.
- DJ compatibility validation.
- Metadata inspection and correction planning.
- Filename sanitization.
- Output folder selection through File System Access API where available.
- Fallback output behavior for unsupported browsers.
- Per-file and global progress tracking.
- Queue management.
- Pause, resume, cancel, and retry.
- Error reporting and recovery.
- Conversion reports and audit logs.

## Non-Functional Requirements

- TypeScript everywhere.
- Strict TypeScript mode.
- No server-side audio processing.
- No business logic in UI components.
- Worker-based long-running processing.
- Conservative memory and concurrency defaults.
- Accessible keyboard and screen reader workflows.
- Testable domain and application layers.
- Structured local observability.

## Initial Compatibility Profiles

- CDJ-safe MP3.
- Rekordbox-compatible MP3.
- WAV archival.
- AIFF archival.
- Generic browser-compatible output.

## Out Of Scope Initially

- User accounts.
- Cloud storage.
- Server-side conversion.
- Streaming service integrations.
- Beatgrid analysis.
- Key detection.
- Waveform rendering.
- AI mastering.

## Visual Product Direction

The current product UI has a documented brutal/minimal local workbench visual baseline. Preserve the direction in `docs/ux/visual-design.md` while continuing functional development.

## Success Criteria

- A user can import a large batch without the app eagerly loading every file into memory.
- A user can inspect compatibility warnings before conversion.
- A user can convert at least one file fully locally.
- A user can understand what completed, failed, remains, and can be retried.
- The app remains responsive during conversion.
- Core domain policies are unit-tested.
- Critical workflows are covered by integration and E2E tests before production release.
