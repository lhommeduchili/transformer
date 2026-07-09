# Folder Structure Proposal

```txt
src/
  app/
    App.tsx
    providers/
    routes/
    error-boundaries/

  features/
    import/
      ui/
      application/
      domain/
      infrastructure/
      tests/

    inspection/
      ui/
      application/
      domain/
      infrastructure/
      tests/

    presets/
      ui/
      application/
      domain/
      infrastructure/
      tests/

    queue/
      ui/
      application/
      domain/
      infrastructure/
      tests/

    conversion/
      ui/
      application/
      domain/
      infrastructure/
      workers/
      tests/

    reports/
      ui/
      application/
      domain/
      infrastructure/
      tests/

    settings/
      ui/
      application/
      domain/
      infrastructure/
      tests/

  shared/
    domain/
    application/
    infrastructure/
    ui/
    testing/

  workers/
    conversion.worker.ts
    inspection.worker.ts

  config/
    presets.ts
    compatibility-profiles.ts
```

## Notes

- Feature modules may contain local domain concepts when they are feature-specific.
- Shared modules must remain small and stable.
- Avoid catch-all `utils` folders.
- Boundary tooling must enforce import direction.
