# ADR 0006: PWA And Electron Distribution

## Status

Accepted

## Context

Transformer needs a downloadable, double-click desktop experience on macOS and Windows while preserving its local-only privacy boundary. A lightweight browser installation is also valuable. Opening the Vite output through `file://` is unreliable because the application uses module workers, a nested FFmpeg worker, and WebAssembly asset loading.

## Decision

Distribute the same renderer in two forms:

- An installable PWA deployed over HTTPS and precached for offline use.
- An Electron desktop application downloaded from GitHub Releases.

The PWA precaches all runtime assets, including the FFmpeg WebAssembly file. It prompts before activating an update so active conversions are not interrupted.

Electron serves packaged renderer assets through the secure, standard `transformer://app` protocol. The renderer remains sandboxed with Node integration disabled. A narrow typed preload bridge implements output directory selection and exclusive file creation behind the existing `OutputWriterPort`; absolute paths remain in the main process.

Desktop releases are built separately on macOS and Windows. Beta macOS artifacts are signed with the local self-signed code-signing identity `transformer self-sign`. They are not notarized and are not trusted by Gatekeeper on other Macs. Public production releases require Apple Developer ID signing and notarization. Windows beta artifacts remain unsigned until a trusted Windows signing identity is available.

## Alternatives Considered

- Raw `file://` distribution: rejected because workers and WebAssembly are not reliably supported and the protocol has unnecessary filesystem privileges in Electron.
- A bundled loopback server: rejected because port allocation, browser selection, and process lifecycle complicate the double-click experience.
- Tauri: deferred because the existing application and automated conversion coverage target Chromium, while macOS WKWebView would require additional compatibility work.
- PWA only: rejected because installation requires an initial HTTPS visit and browser output capabilities vary.

## Consequences

- Users can choose a small browser-installed PWA or a standalone desktop app.
- Audio processing remains local and worker-isolated in both distributions.
- The 32 MB FFmpeg WebAssembly asset is stored in the PWA cache and desktop package.
- Electron increases download size and requires timely framework security updates.
- Desktop filesystem access is limited to explicitly selected output directories and opaque renderer tokens.
- Self-signed macOS beta builds still require the user's explicit Gatekeeper override.
- Release automation needs platform-specific runners, signing secrets, and packaged-runtime smoke tests.

## Quality Attribute Impact

- Composability: browser and desktop output adapters implement the same application port.
- Maintainability: one renderer is shared by both distribution targets.
- Scalability: conversion remains local with conservative single-worker concurrency.
- Testability: PWA offline conversion and packaged Electron loading receive dedicated smoke tests.
- Observability: failures remain local and no telemetry is introduced.
- Type safety: the preload bridge exposes explicit typed operations rather than generic IPC.
- Performance: PWA installation caches a large WASM asset; Electron carries Chromium overhead.
- Accessibility: both targets retain the same accessible renderer and update prompts.
