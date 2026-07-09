# Worker And WASM Rules

## FFmpeg.wasm

- FFmpeg.wasm must be accessed through an infrastructure adapter.
- FFmpeg execution must happen in workers, not React components or the main UI thread.
- Worker command and event messages must be typed.
- Worker errors must be serializable and classified by application code.

## Memory

- Do not keep input and output buffers longer than necessary.
- Clean FFmpeg virtual file system entries after each job.
- Avoid multiple FFmpeg instances unless profiling proves safety.
- Treat large input files as high-risk and surface warnings.

## Control

- Support pause, resume, cancel, retry, and failure recovery at the application level.
- Define safe cancellation boundaries clearly.
- Preserve queue integrity when a worker fails.
