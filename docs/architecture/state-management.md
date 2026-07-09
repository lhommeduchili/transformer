# State Management Strategy

## State Categories

### Domain State

- Audio assets.
- Track inspections.
- Conversion jobs.
- Queue status.
- Presets.
- Validation results.

### UI State

- Selected panels.
- Expanded rows.
- Filters.
- Sorting.
- Dialog state.

### Runtime State

- Worker status.
- Active progress events.
- Memory warnings.
- Current conversion operation.

### Persistent Preferences

- Last selected preset.
- Filename policy.
- Metadata policy.
- User-selected concurrency preference, if supported.

## Recommended Tool

Use Zustand for lightweight client state.

Stores should hold state and dispatch application use cases. Stores must not contain domain business rules.

## Event Bus

Use a typed internal event bus for:

- Job progress.
- Queue status changes.
- Worker lifecycle events.
- Error notifications.
- Report updates.

## TanStack Query

Do not use TanStack Query initially.

Reason: the app is local-first and queue/event-driven rather than server-state-driven.
