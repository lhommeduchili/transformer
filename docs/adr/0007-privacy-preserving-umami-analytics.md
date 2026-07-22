# ADR 0007: Privacy-Preserving Umami Analytics

## Status

Accepted

## Context

To understand overall website and app usage without compromising user privacy or violating the zero-knowledge local audio processing guarantee, Transformer requires a lightweight visit monitoring mechanism. Standard analytics suites often send sensitive payloads, events, or detailed user telemetry to cloud servers.

## Decision

We introduce optional page-visit analytics powered by Umami, isolated behind a clean application port (`AnalyticsPort`), following the exact zero-environment-variable proxy architecture used across existing projects (`kirara` and `lhommeduchili.xyz`):

1. **Vercel Rewrites**: Calls to `/stats/script.js` and `/stats/api/send` are proxied directly to the central Umami Vercel deployment (`https://umami-analytics-lhommeduchilis-projects.vercel.app`) via `vercel.json`.
2. **Zero Vercel Environment Variables**: Configuration is stored in static application config (`src/config/analytics-config.ts`), removing any need to configure build-time environment variables in Vercel.
3. **Zero Audio Data Exposure**: No track titles, filenames, folder paths, audio metadata (artist, album, tags), audio waveforms, logs, or conversion error messages may ever be captured or transmitted.
4. **Visit-Only Scope**: Telemetry is restricted purely to standard page loading and path navigation (`init()` and `trackPageView()`).
5. **Offline Safety**: Script injection and tracking calls are non-blocking. If the network is unavailable (e.g. PWA offline mode or Electron environment), failures are handled gracefully without throwing exceptions or affecting application UI or audio conversion.

## Alternatives Considered

- Setting environment variables across Vercel deployments.
- Direct external script loading from third-party domains.
- Standard Google Analytics or Mixpanel with custom event tracking.
- No analytics monitoring.

## Consequences

- Maintainers can track page visit volume without managing environment variables in Vercel.
- Bypasses ad-blocker domain restrictions by serving script and collection endpoints on `/stats`.
- The core privacy guarantee of Transformer remains completely intact.
- The application architecture respects clean boundaries by abstracting analytics behind an application port.

## Quality Attribute Impact

- Privacy & Security: High confidence; audio files and metadata remain 100% client-side and unmonitored.
- Reliability & Availability: No impact on offline PWA or Electron usage.
- Maintainability: Enforced by typed application ports, static application configuration, Vercel proxy rewrites, and no-op adapters.
