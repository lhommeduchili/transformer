# Production Readiness

Phase 11 defines the release-readiness baseline for the local-first DJ audio preparation app.

For day-to-day continuation context, start with `docs/operations/project-handoff.md`.

## Automated Gates

Required before release:

- `npm run format:check`
- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run arch`
- `npm run build`
- `npm run test:e2e`
- Relevant `npm run test:electron` packaged-runtime smoke test

CI must run the same gates, including Chromium Playwright smoke tests.

## Privacy And Security Checklist

- Audio files are processed locally in the browser.
- No upload endpoints, fetch-based audio transfer, cloud storage, or remote metadata enrichment are present.
- Reports contain filenames, output names, queue statuses, preset identifiers, timestamps, error messages, and bounded metadata-assessment findings (completeness, source format, missing essential fields, and artwork presence state).
- Reports must never contain audio bytes or embedded artwork bytes.
- File System Access permission is requested only after an explicit user action.
- File handles are not persisted silently.
- FFmpeg runs in a worker, not the UI thread.
- FFmpeg core JavaScript and WebAssembly are bundled locally; conversion does not fetch executable code from a CDN at runtime.
- Electron uses a sandboxed custom protocol, restrictive CSP, and a typed output-only preload bridge.
- PWA offline conversion is tested after all network access is disabled.

## Compatibility Checklist

- Default preset remains `CDJ / Rekordbox Safe AIFF`.
- AIFF output uses `pcm_s16be`, 44.1kHz, stereo.
- Text metadata is preserved for built-in presets.
- Embedded artwork is preserved for AIFF and MP3 where FFmpeg can map the source artwork stream.
- Filename structure such as `Artist - Song.flac` is preserved as `Artist - Song.aiff`.
- Unsafe filesystem/DJ-hardware filename characters are still sanitized.
- Compatibility warnings cover unsupported source container/codec, planned conversion, sample-rate changes, bitrate changes, stereo rendering, and incomplete inspection data.

## Accessibility Checklist

- Import, preset selection, output destination, queue controls, and report export are keyboard reachable.
- Disabled controls have visible guidance.
- Queue progress is exposed through a status region.
- Errors use alert semantics where appropriate.
- Automated axe checks pass in Playwright.
- Manual keyboard review is required before public release.

## Visual Design Checklist

- `docs/ux/visual-design.md` remains accurate for the shipped UI.
- The app preserves the brutal/minimal void-black workbench direction.
- Primary and secondary buttons use documented inversion behavior.
- Compact destructive actions remain text-only and crimson on hover/focus.
- The drop zone uses phosphor green interaction feedback.
- Queue progress uses the documented ASCII meter and accessible status text.
- Job rows use text/spinner status rather than filled progress bars.
- Desktop and mobile layouts receive manual visual review before release.

## Performance Checklist

- Import and planning avoid reading full audio bytes; inspection reads bounded local headers only.
- Queue planning handles at least 1,000 lightweight entries.
- Report generation handles at least 1,000 jobs.
- Conversion reads only the active file.
- Default conversion concurrency remains `1`.
- Browser memory should be manually profiled with representative FLAC files before public release.

## Known Limitations

- Automated Playwright coverage performs one generated silent-WAV-to-AIFF conversion; broader real-format metadata/artwork coverage remains limited.
- Real metadata/artwork compatibility must be manually verified with Rekordbox and target CDJ hardware.
- Browser folder writing depends on File System Access API support; unsupported browsers use downloads.
- macOS beta desktop artifacts use an untrusted self-signed identity and require a Gatekeeper override; production releases require Developer ID signing and notarization.
- Windows beta desktop artifacts are unsigned until trusted Windows code signing is configured.
- `@ffmpeg/core` distribution requires GPL corresponding-source and notice compliance before a public release.
- Visual regression coverage is currently manual.
