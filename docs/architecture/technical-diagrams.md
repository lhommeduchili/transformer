# Technical Architecture Diagrams

## Layer Diagram

```txt
+--------------------------------------------------+
| UI Layer                                         |
| React, forms, queue views, progress, errors      |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
| Application Layer                                |
| Use cases, queue orchestration, progress mapping |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
| Domain Layer                                     |
| Entities, value objects, policies, events        |
+-------------------------+------------------------+
                          ^
                          |
+--------------------------------------------------+
| Infrastructure Layer                             |
| FFmpeg.wasm, workers, file system, metadata      |
+--------------------------------------------------+
```

## Processing Pipeline

```txt
Import
  -> Normalize File References
  -> Inspect Metadata
  -> Validate Compatibility
  -> Apply Preset
  -> Sanitize Filename
  -> Queue Conversion Job
  -> Worker Executes FFmpeg.wasm
  -> Write Output File
  -> Verify Output
  -> Record Report
```

## Worker Runtime

```txt
Main Thread
  -> UI
  -> Queue Controller
  -> Progress Aggregator
  -> Worker Pool Manager
       -> Conversion Worker 1
            -> FFmpeg.wasm Instance
       -> Conversion Worker 2, only if profiling allows
            -> FFmpeg.wasm Instance
       -> Inspection Worker
            -> Metadata Parser or FFprobe-style inspection
```

## Dependency Rule

```txt
Domain: no external runtime dependencies
Application: domain plus ports
Infrastructure: port implementations
UI: application-facing adapters only
```
