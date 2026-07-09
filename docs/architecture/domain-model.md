# Domain Model

## Entities

### AudioAsset

Represents an imported source file reference.

Fields:

- `id`
- `sourceName`
- `sourcePath`
- `sizeBytes`
- `mimeType`
- `extension`
- `fileReference`
- `importedAt`

### TrackInspection

Represents discovered technical and metadata properties.

Fields:

- `assetId`
- `durationMs`
- `bitrateKbps`
- `sampleRateHz`
- `channels`
- `codec`
- `container`
- `metadata`
- `warnings`

### ConversionPreset

Represents output rules.

Fields:

- `id`
- `name`
- `targetContainer`
- `targetCodec`
- `bitrateKbps`
- `sampleRateHz`
- `channels`
- `metadataPolicy`
- `filenamePolicy`
- `compatibilityProfile`

### ConversionJob

Represents one file moving through planning, conversion, writing, and reporting.

Fields:

- `id`
- `assetId`
- `presetId`
- `outputName`
- `status`
- `progress`
- `attempts`
- `errors`

### ConversionQueue

Represents a batch of conversion jobs.

Fields:

- `id`
- `jobs`
- `status`
- `createdAt`
- `startedAt`
- `completedAt`

## Value Objects

- `AudioAssetId`
- `ConversionJobId`
- `QueueId`
- `PresetId`
- `SafeFilename`
- `Bitrate`
- `SampleRate`
- `Duration`
- `FileSize`
- `ProgressPercent`
- `CompatibilityProfile`
- `OutputPathPolicy`

## State Machines

### Job Status

```txt
pending -> inspecting -> ready -> converting -> writing -> completed
pending -> skipped
ready -> skipped
converting -> cancelling -> cancelled
converting -> failed
writing -> failed
failed -> pending
```

### Queue Status

```txt
idle -> running -> paused -> running
running -> cancelling -> cancelled
running -> completed
running -> completed_with_errors
running -> failed
```

## Domain Events

- `AudioAssetsImported`
- `TrackInspectionStarted`
- `TrackInspectionCompleted`
- `TrackInspectionFailed`
- `ConversionJobQueued`
- `ConversionJobStarted`
- `ConversionJobProgressed`
- `ConversionJobPaused`
- `ConversionJobResumed`
- `ConversionJobCancelled`
- `ConversionJobCompleted`
- `ConversionJobFailed`
- `ConversionJobRetried`
- `QueueStarted`
- `QueuePaused`
- `QueueResumed`
- `QueueCompleted`
- `QueueFailed`
- `ReportGenerated`

## Domain Policies

- Filename sanitization policy.
- Compatibility validation policy.
- Preset validation policy.
- Queue transition policy.
- Retry eligibility policy.
- Error classification policy.

All policies must be deterministic and unit-tested.
