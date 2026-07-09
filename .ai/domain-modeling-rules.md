# Domain Modeling Rules

## Domain Layer

The domain layer owns:

- Audio assets
- Track inspections
- Conversion presets
- Compatibility profiles
- Conversion jobs
- Conversion queues
- Filename policies
- Metadata policies
- Error classification
- Domain events

## Rules

- Domain code must not import React, browser APIs, workers, FFmpeg, Zustand, or infrastructure.
- Use entities where identity and lifecycle matter.
- Use value objects for constrained concepts such as bitrate, sample rate, safe filename, duration, and progress.
- Use domain events for meaningful state changes.
- Keep policies deterministic and unit-testable.
- Do not encode browser quirks in domain models.
