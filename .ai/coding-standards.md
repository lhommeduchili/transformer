# Coding Standards

## TypeScript

- Use TypeScript everywhere.
- Enable strict mode.
- Prefer explicit domain types over primitive obsession.
- Use discriminated unions for state machines and error types.
- Validate external input with Zod or equivalent runtime schemas.
- Avoid `any`; justify unavoidable cases locally.

## React

- React components must not contain business logic.
- Components may orchestrate UI interaction and call application use cases.
- Keep feature UI close to its feature module.
- Shared UI components must be generic and domain-agnostic.
- Do not introduce memoization by default; use it only when profiling or team conventions justify it.

## Error Handling

- Errors must be typed and classifiable.
- User-facing errors must include a recoverable action where possible.
- Infrastructure errors must be translated before crossing into application/domain behavior.

## Naming

- Use names that reflect domain intent.
- Avoid ambiguous names like `manager`, `handler`, or `utils` unless the scope is genuinely generic.
- Prefer feature-specific modules over global catch-all folders.

## Comments

- Prefer clear code over comments.
- Add comments only for non-obvious decisions, browser constraints, or WASM/workflow caveats.
