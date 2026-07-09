# Global Architecture Principles

These rules apply to every AI assistant, IDE agent, human contributor, and generated change in this repository.

## Priorities

Evaluate architectural decisions against these priorities, in order:

1. Composability
2. Maintainability
3. Scalability
4. Testability
5. Observability
6. Type safety
7. Performance
8. Accessibility

Performance matters, but not at the expense of opaque, tightly coupled, or untestable code. Optimize deliberately after boundaries and behavior are correct.

## Layering

The application uses a feature-oriented clean architecture:

- UI layer renders state and captures user intent.
- Application layer coordinates use cases and workflows.
- Domain layer owns business concepts, policies, rules, entities, value objects, and domain events.
- Infrastructure layer implements ports for browser APIs, workers, FFmpeg.wasm, file access, logging, and report export.

Allowed dependency direction:

- UI -> Application
- Application -> Domain
- Infrastructure -> Application ports and Domain types
- Tests -> Layer under test

Forbidden dependency direction:

- Domain -> React, browser APIs, FFmpeg, Zustand, infrastructure, UI
- Application -> React, UI components, concrete infrastructure adapters
- UI -> FFmpeg, File System Access API, metadata parser implementations

## Architectural Rules

- Keep domain logic framework-independent.
- Keep application services independent of UI components.
- Depend on ports/interfaces, not concrete adapters.
- Prefer explicit contracts over implicit coupling.
- Avoid monolithic services and large components.
- Keep modules small and cohesive.
- Add an ADR for every non-trivial architectural decision.
- Do not add backward compatibility unless there is a real persisted-data, external-consumer, or shipped-behavior requirement.

## Privacy Rules

- Audio files must never be uploaded to a server.
- No server-side audio storage is allowed.
- No cloud analytics may capture filenames, metadata, or audio-derived information without a future explicit privacy review.
- Reports and logs must be local-first.

## Worker And WASM Rules

- FFmpeg.wasm must run outside the UI thread.
- Long-running conversion must expose progress, cancellation, retry, and failure states.
- Default concurrency must be conservative.
- Large batches must avoid eager full-library reads.
- Release large buffers as soon as possible.
