# Processing Pipeline Design

## Stages

```txt
Import -> Inspect -> Validate -> Plan -> Convert -> Write -> Verify -> Report
```

## Import

Responsibilities:

- Accept files and folders where supported.
- Filter supported audio candidates.
- Create asset references.
- Avoid eager full-file reads.

## Inspect

Responsibilities:

- Determine container, codec, bitrate, sample rate, channels, duration, and metadata where possible.
- Generate compatibility warnings.
- Run off the main thread where practical.

## Validate

Responsibilities:

- Compare source properties against compatibility profiles.
- Report unsupported or risky inputs.
- Preserve uncertainty when inspection is incomplete.

## Plan

Responsibilities:

- Apply output preset.
- Sanitize filename.
- Resolve output conflicts.
- Create conversion jobs.

## Convert

Responsibilities:

- Load only the active file into worker-managed FFmpeg memory.
- Emit progress.
- Support cancellation boundaries.
- Clean up virtual file system entries and large buffers.

## Write

Responsibilities:

- Write output through File System Access API where available.
- Use fallback browser download behavior where required.
- Verify write completion.

## Report

Responsibilities:

- Record completed, failed, skipped, and warning states.
- Export local JSON report initially.
- Add CSV export later if needed.
