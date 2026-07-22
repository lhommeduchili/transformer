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

## Visual & Aesthetic Design Standards

- **Margin & Padding Consistency**: Maintain uniform interior margins and padding across all workbench containers, cards, and drop zones (`clamp(0.85rem, 2vw, 1.15rem)`). Do not introduce arbitrary or divergent box padding across adjacent components.
- **Grid Subgrid & Height Alignment**: Multi-column workbench layouts must align panel heights dynamically across rows (using CSS `subgrid`). In default/empty states, primary column cards (such as the drop audio card) and secondary column stacks (preset + destination panels) must maintain pixel-exact top and bottom border alignment, accounting for border line thickness.
- **Unobtrusive PWA Lifecycle**: Service worker updates and PWA operations must run seamlessly in the background (`autoUpdate`) without intrusive popups, banners, badges, or user prompts. Visible notification systems must strictly align with the application's aesthetic design principles before deployment.
