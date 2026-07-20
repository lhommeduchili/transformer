# ADR 0005: File System Access API With Fallback

## Status

Accepted

## Context

The product needs output folder selection for batch conversion, but File System Access API support varies by browser.

## Decision

Use File System Access API through an infrastructure adapter when available. Provide fallback download behavior when unavailable.

## Alternatives Considered

- Require only browsers with File System Access API.
- Use server-side zip generation.
- Force per-file browser downloads everywhere.

## Consequences

- Supported browsers get professional batch output workflows.
- Unsupported browsers remain usable but less efficient.
- Capability detection and clear UX messaging are required.

## Quality Attribute Impact

- Composability: file writing remains behind a port.
- Maintainability: browser-specific logic is isolated.
- Scalability: folder writes support large batches better than repeated downloads.
- Testability: file writer can be mocked.
- Observability: write results can be logged locally.
- Type safety: permission and write states can be discriminated unions.
- Performance: avoids unnecessary server roundtrips.
- Accessibility: permission prompts need clear explanations and recovery actions.
