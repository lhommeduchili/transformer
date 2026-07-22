# Review Checklist

Use this checklist before merging or accepting AI-generated work.

## Architecture

- Does the change preserve layer boundaries?
- Are dependencies pointed in the correct direction?
- Is business logic outside UI components?
- Are infrastructure details hidden behind ports?
- Is the module small and composable?
- Is a new ADR required?

## Type Safety

- Does the change avoid `any`?
- Are state transitions explicit?
- Are external inputs validated?
- Are errors typed?

## Privacy And Security

- Does the change avoid audio uploads?
- Does it avoid leaking filenames or metadata externally?
- Are logs local and structured?

## Performance

- Does the change avoid eager loading of large libraries?
- Is worker usage appropriate?
- Is memory released after large operations?
- Are concurrency defaults safe?

## Accessibility

- Is keyboard access supported?
- Is progress available to assistive technology?
- Are errors discoverable and actionable?
- Is focus managed correctly?

## Testing

- Are domain rules tested?
- Are application use cases tested with mocked ports?
- Are worker protocols tested where changed?
- Are E2E tests added for user-visible workflows?

## Visual Alignment & Aesthetics

- Are card padding and interior margins uniform across all containers?
- Do adjacent workbench panels maintain horizontal and vertical grid alignment (e.g., CSS subgrid)?
- Are PWA updates handled automatically without unaligned user prompts or banners?
