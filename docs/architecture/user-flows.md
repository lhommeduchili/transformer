# User Flows

## First-Time Use

1. User opens the app.
2. App explains local-only processing.
3. App checks browser capabilities.
4. User sees supported and unsupported capabilities.
5. User imports files or folders.

## Batch Import

1. User drags files or folders into the import area.
2. User can alternatively use a keyboard-accessible file picker.
3. App filters candidate audio files.
4. App reports unsupported files.
5. App creates `AudioAsset` records without eagerly reading full file contents.
6. App starts inspection where safe.

## Preset Selection

1. User selects an output preset.
2. App explains compatibility target and tradeoffs.
3. User optionally adjusts metadata and filename policies.
4. App validates settings.
5. App previews output filenames and warnings.

## Output Destination

1. User selects an output folder.
2. Browser requests permission where File System Access API is supported.
3. App verifies write capability.
4. App shows selected destination or fallback mode.

## Conversion

1. User reviews queue.
2. User starts processing.
3. App processes jobs through worker-managed conversion.
4. App shows per-file and global progress.
5. App writes completed files locally.
6. App releases memory after each job.
7. App generates a report.

## Error Recovery

1. Job fails.
2. App classifies the error.
3. User sees reason and suggested action.
4. User retries, skips, removes, or changes settings.
5. Queue continues where safe.

## Pause And Resume

1. User pauses the queue.
2. App stops starting new jobs.
3. Active jobs reach a safe cancellation or pause boundary where possible.
4. User resumes processing.
5. App continues from remaining work.
