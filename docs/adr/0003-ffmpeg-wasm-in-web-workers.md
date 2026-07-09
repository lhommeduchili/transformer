# ADR 0003: FFmpeg.wasm In Web Workers

## Status

Accepted

## Context

Audio conversion is CPU and memory intensive. Running FFmpeg.wasm on the main thread would risk blocking the UI during long conversions.

## Decision

Run FFmpeg.wasm in Web Workers behind infrastructure adapters and typed worker protocols.

## Alternatives Considered

- Main-thread FFmpeg.wasm.
- Server-side FFmpeg.
- Native desktop runtime.

## Consequences

- UI responsiveness is protected.
- Worker protocol design and serialization become important.
- Cancellation and progress must be explicitly modeled.

## Quality Attribute Impact

- Composability: conversion is isolated behind ports.
- Maintainability: worker protocol becomes a stable boundary.
- Scalability: worker pool can evolve with profiling.
- Testability: worker commands can be tested independently.
- Observability: progress and errors flow through typed events.
- Type safety: worker messages must be typed.
- Performance: prevents main-thread blocking.
- Accessibility: responsive UI supports assistive technology during long jobs.
