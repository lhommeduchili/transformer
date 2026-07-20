# ADR 0004: Zustand For Client State

## Status

Accepted

## Context

The app needs local UI and queue state, not server cache management. State will be driven by application use cases and internal events.

## Decision

Use Zustand as the initial lightweight client state library. Keep stores thin and free of domain business logic.

## Alternatives Considered

- React Context only.
- Redux Toolkit.
- TanStack Query.
- XState.

## Consequences

- Small API surface and low overhead.
- Requires discipline to avoid placing business logic in stores.
- Complex state machines may later justify dedicated modeling for specific features.

## Quality Attribute Impact

- Composability: feature stores can remain focused.
- Maintainability: minimal boilerplate.
- Scalability: adequate for local state if stores stay modular.
- Testability: stores can be tested through use-case dispatching.
- Observability: events can feed store updates.
- Type safety: state slices can be typed.
- Performance: lightweight subscriptions help large queue rendering.
- Accessibility: no direct impact.
