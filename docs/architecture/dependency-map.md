# Dependency Map

## Allowed Dependencies

```txt
UI -> Application
UI -> Shared UI
Application -> Domain
Application -> Shared Application
Infrastructure -> Application Ports
Infrastructure -> Domain Types
Tests -> Layer Under Test
```

## Forbidden Dependencies

```txt
Domain -> React
Domain -> Zustand
Domain -> FFmpeg
Domain -> Browser APIs
Domain -> Infrastructure
Application -> React
Application -> Concrete Infrastructure
Application -> UI
UI -> FFmpeg Adapter
UI -> File System Access API directly
UI -> Metadata Parser directly
```

## Ports

- `AudioInspectionPort`
- `AudioConversionPort`
- `OutputFileWriterPort`
- `InputFileReaderPort`
- `MetadataReaderPort`
- `LoggerPort`
- `ReportWriterPort`
- `BrowserCapabilitiesPort`
- `WorkerRuntimePort`
- `ClockPort`
- `IdGeneratorPort`

## Enforcement

Use ESLint import rules, dependency-cruiser, or equivalent architecture tests to enforce forbidden imports.
