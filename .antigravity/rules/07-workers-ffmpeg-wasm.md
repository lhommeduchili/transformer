# Workers And FFmpeg.wasm Rules

- Run FFmpeg.wasm in workers.
- Keep worker messages typed.
- Keep concurrency conservative by default.
- Do not eagerly load entire libraries into memory.
- Release large buffers and virtual files after every job.
- Make conversion progress, cancellation, retry, and failure observable.
