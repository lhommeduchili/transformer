# ADR 0002: Feature-Oriented Clean Architecture

## Status

Accepted

## Context

The application must evolve for years while supporting complex workflows: import, inspection, validation, conversion, writing, reporting, and queue recovery.

## Decision

Use feature-oriented clean architecture with Domain, Application, Infrastructure, and UI layers.

## Alternatives Considered

- Flat React application.
- Layer-only architecture without feature modules.
- Service-heavy architecture centered on large managers.

## Consequences

- Domain and application logic remain testable without React or browser APIs.
- Feature ownership is clearer.
- More upfront structure is required.

## Quality Attribute Impact

- Composability: feature modules and ports promote reuse.
- Maintainability: dependency direction is explicit.
- Scalability: features can grow independently.
- Testability: domain and application tests stay lightweight.
- Observability: application layer centralizes meaningful events.
- Type safety: contracts are explicit.
- Performance: infrastructure choices can evolve behind ports.
- Accessibility: UI can focus on interaction quality rather than business rules.
