# GitHub Copilot Instructions

This project is a browser-native, local-first DJ audio preparation tool.

## Core Rules

- Keep all audio processing client-side.
- Never add server-side audio upload, storage, inspection, conversion, or logging paths.
- Use TypeScript strict mode.
- Preserve clean architecture boundaries.
- Keep business logic out of React components.
- Keep FFmpeg.wasm behind infrastructure ports and Web Workers.
- Do not eagerly load large batches of files into memory.
- Prefer composable, tested modules.

## Architecture

- Domain owns business rules and must be framework-independent.
- Application owns use cases and depends on ports.
- Infrastructure implements browser, worker, FFmpeg, file, logging, and report adapters.
- UI renders state and captures user intent.

## Before Suggesting Code

- Check relevant docs under `docs/architecture/`.
- Check ADRs under `docs/adr/`.
- Keep suggestions minimal and testable.
