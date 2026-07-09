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

CI must run the same gates, including Chromium Playwright smoke tests.

## Privacy And Security Checklist

- Audio files are processed locally in the browser.
- No upload endpoints, fetch-based audio transfer, cloud storage, or remote metadata enrichment are present.
- Reports contain filenames, output names, queue statuses, preset identifiers, timestamps, and error messages only.
- Reports must never contain audio bytes or embedded artwork bytes.
- File System Access permission is requested only after an explicit user action.
- File handles are not persisted silently.
- FFmpeg runs in a worker, not the UI thread.

## Compatibility Checklist

- Default preset remains `CDJ / Rekordbox Safe AIFF`.
- AIFF output uses `pcm_s16be`, 44.1kHz, stereo.
- Text metadata is preserved for built-in presets.
- Embedded artwork is preserved for AIFF and MP3 where FFmpeg can map the source artwork stream.
- Filename structure such as `Artist - Song.flac` is preserved as `Artist - Song.aiff`.
- Unsafe filesystem/DJ-hardware filename characters are still sanitized.

## Accessibility Checklist

- Import, preset selection, output destination, queue controls, and report export are keyboard reachable.
- Disabled controls have visible guidance.
- Queue progress is exposed through a status region.
- Errors use alert semantics where appropriate.
- Automated axe checks pass in Playwright.
- Manual keyboard review is required before public release.

## Performance Checklist

- Import and planning avoid reading audio bytes.
- Queue planning handles at least 1,000 lightweight entries.
- Report generation handles at least 1,000 jobs.
- Conversion reads only the active file.
- Default conversion concurrency remains `1`.
- Browser memory should be manually profiled with representative FLAC files before public release.

## Known Limitations

- Automated tests do not perform real FFmpeg conversion with fixture audio.
- Real metadata/artwork compatibility must be manually verified with Rekordbox and target CDJ hardware.
- Browser folder writing depends on File System Access API support; unsupported browsers use downloads.
- Final visual design and branding are intentionally deferred.
