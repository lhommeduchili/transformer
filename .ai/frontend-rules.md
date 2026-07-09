# Frontend Rules

## UI Responsibilities

The UI layer is responsible for:

- Rendering application state.
- Capturing user intent.
- Accessibility behavior.
- Forms and validation presentation.
- Progress display.
- Error presentation.

The UI layer is not responsible for:

- Compatibility rules.
- Queue state transitions.
- Conversion planning.
- Filename sanitization logic.
- Direct FFmpeg calls.
- Direct browser file-system writes.

## UX Principles

- Users must always understand what is happening, what completed, what failed, what remains, and what actions are available.
- Prefer explicit status and recovery actions over hidden automation.
- Use progressive disclosure for detailed logs and metadata.
- Keep power-user workflows efficient without sacrificing clarity.
