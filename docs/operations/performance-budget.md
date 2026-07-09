# Performance Budget

Phase 10 establishes initial performance guardrails for local-first DJ batch preparation. Phase 11 treats these as release-readiness checks.

## Budgets

- Queue operations must remain usable with at least 1,000 lightweight entries.
- Default conversion concurrency is 1 until profiling proves higher concurrency is safe.
- Main-thread tasks longer than 50ms require review before production readiness.
- Progress updates should avoid noisy UI churn; initial budget is at most 10 progress events per second per active job.
- Import and queue planning must not read audio bytes for inactive files.

## Manual Profiling Checklist

- Import 100 files and verify the UI remains responsive.
- Plan a 1,000-file synthetic queue and verify controls remain usable.
- Convert one real FLAC to AIFF and verify memory returns close to baseline after completion.
- Convert several FLAC files sequentially and verify only one active file is read at a time.
- Cancel an active conversion and verify the next run still works.
- Export a report for a large queue and verify it contains metadata only, not audio bytes.

## Current Decision

Keep FFmpeg.wasm conversion sequential. Parallel conversion risks browser memory pressure and should only be introduced after measurement on representative DJ libraries.
