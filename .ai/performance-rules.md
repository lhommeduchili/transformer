# Performance Rules

## Core Constraints

- Large music libraries may contain hundreds or thousands of files.
- FFmpeg.wasm can consume substantial memory.
- Browsers can terminate tabs under memory pressure.
- Long-running jobs may be interrupted by tab sleep, navigation, or crashes.

## Required Design Choices

- Never read every imported file into memory during import.
- Process files progressively.
- Use workers for inspection and conversion.
- Keep FFmpeg concurrency conservative by default.
- Release buffers and virtual file system entries after each job.
- Provide cancellation and retry semantics.
- Surface file size and compatibility warnings before processing where possible.

## Budgets

Initial budgets must be refined with measurement, but the architecture should target:

- UI remains responsive during conversion.
- Queue operations remain usable with at least 1,000 entries.
- Default conversion concurrency starts at 1 until profiling proves higher values are safe.
- Main-thread blocking tasks longer than 50ms require review.
