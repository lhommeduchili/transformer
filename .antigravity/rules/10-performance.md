# Performance Rules

- Treat memory pressure as a first-class constraint.
- Avoid main-thread conversion work.
- Keep queue operations responsive for large batches.
- Start with conversion concurrency of 1 unless profiling supports more.
- Add stress tests before production readiness.
