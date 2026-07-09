# Security And Privacy Rules

## Local-Only Processing

- Audio files must stay on the user's device.
- Conversion, metadata inspection, filename sanitization, reporting, and validation must run locally.
- Do not add upload endpoints or server-side audio storage.
- Do not add remote metadata enrichment without a future explicit design and privacy review.

## Data Handling

- Treat filenames, paths, metadata, and logs as sensitive.
- Keep audit logs local.
- Do not persist file handles without explicit user choice and clear browser permission behavior.
- Do not send crash reports containing filenames, paths, tags, or audio-derived data.

## Browser Permissions

- Use File System Access API only through infrastructure adapters.
- Explain permission requests in the UI before browser prompts.
- Handle denied permissions gracefully.

## Dependencies

- Prefer minimal dependencies.
- Review libraries that parse untrusted media files carefully.
- Keep FFmpeg.wasm and metadata parser versions explicit.
