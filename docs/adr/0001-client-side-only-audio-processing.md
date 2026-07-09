# ADR 0001: Client-Side Only Audio Processing

## Status

Accepted

## Context

The product prepares private DJ music libraries. Uploading audio files, filenames, metadata, or reports would create privacy risk, storage cost, bandwidth cost, licensing concerns, and user trust issues.

## Decision

All audio processing must run locally in the browser. The app must not upload audio files to a server for conversion, inspection, validation, reporting, or logging.

## Alternatives Considered

- Server-side conversion.
- Hybrid local upload fallback.
- Desktop application.

## Consequences

- The app avoids storage costs and reduces privacy risk.
- Browser capabilities and memory limits become central constraints.
- Long-running workflows must communicate browser lifecycle limitations honestly.

## Quality Attribute Impact

- Composability: local adapters expose capabilities through ports.
- Maintainability: privacy rule is simple and global.
- Scalability: server costs do not scale with file volume.
- Testability: conversion can be mocked through ports.
- Observability: logs and reports must remain local.
- Type safety: local data boundaries can be typed explicitly.
- Performance: constrained by user device and browser runtime.
- Accessibility: no direct impact, but local progress must be clearly communicated.
