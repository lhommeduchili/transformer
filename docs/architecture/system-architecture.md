# System Architecture

## Architectural Style

The application uses a feature-oriented clean architecture with explicit separation between Domain, Application, Infrastructure, and UI layers.

```txt
UI Layer
  -> Application Layer
    -> Domain Layer

Infrastructure Layer
  -> Application Ports
  -> Domain Types
```

## Principles

- Composability: features are built from small modules with clear contracts.
- Maintainability: dependency direction is explicit and enforceable.
- Scalability: queue, worker, and reporting systems are designed for large batches.
- Testability: domain and application behavior can be tested without browser APIs.
- Observability: state transitions, progress, errors, and reports are structured.
- Type safety: TypeScript strict mode and typed ports are mandatory.
- Performance: worker isolation and conservative concurrency protect the browser.
- Accessibility: interaction patterns must support keyboard and assistive technology users.

## Layer Responsibilities

### Domain Layer

Owns entities, value objects, policies, domain errors, and domain events.

It must not import React, browser APIs, FFmpeg, workers, Zustand, or infrastructure code.

### Application Layer

Owns use cases and orchestration.

Examples:

- Import assets.
- Inspect tracks.
- Plan conversion jobs.
- Start, pause, resume, cancel, and retry queues.
- Aggregate progress.
- Generate reports.

It depends on domain types and abstract ports.

### Infrastructure Layer

Implements ports for concrete browser and runtime capabilities.

Examples:

- FFmpeg.wasm adapter.
- Conversion worker runtime.
- Metadata inspection adapter.
- File System Access API adapter.
- Browser capability detection.
- Structured local logger.
- Report export writer.

### UI Layer

Renders state and captures user intent.

It must not contain business rules or direct infrastructure calls.

## Runtime Components

```txt
App Shell
  -> Feature UI
  -> Application Use Cases
  -> Domain Policies
  -> Ports
  -> Infrastructure Adapters
  -> Workers
  -> FFmpeg.wasm
```

## Technical Stack Decision

Initial recommended stack:

- React for UI.
- TypeScript for all application code.
- Vite for build tooling.
- FFmpeg.wasm for local conversion.
- Zustand for lightweight client state.
- Zod for boundary validation.
- React Hook Form for forms where needed.
- Vitest for unit and integration tests.
- Playwright for E2E tests.
- ESLint, Prettier, and architecture boundary tooling.

TanStack Query is deferred because the application is local-first and queue/event-driven rather than server-state-driven.

## Browser Constraints

- File System Access API support is not universal.
- Folder import support varies by browser.
- FFmpeg.wasm has high memory overhead.
- Background processing is limited by browser lifecycle behavior.

The architecture must expose these limitations clearly through capability detection and user-facing messaging.
