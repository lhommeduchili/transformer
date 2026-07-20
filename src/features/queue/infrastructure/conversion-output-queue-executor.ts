import type { ClockPort } from '../../../shared/application/clock-port';
import type { AudioConversionPort } from '../../conversion/application/audio-conversion-port';
import type { AudioConversionCommand } from '../../conversion/application/conversion-command';
import {
  cancelUnstartedJob,
  completeJob,
  failJob,
  markCancelled,
  markReady,
  requestCancel,
  skipJob,
  startConversion,
  startInspection,
  startWriting,
  updateProgress,
  type ConversionJob,
} from '../../conversion/domain/conversion-job';
import type { ImportedFileRegistry } from '../../import/application/imported-file-registry';
import type { OutputWriterPort } from '../../output/application/output-writer-port';
import type { ConversionPreset } from '../../presets/domain/conversion-preset';
import type {
  QueueExecutorControls,
  QueueExecutorOptions,
  QueueExecutorPort,
} from '../application/queue-executor-port';
import type { ConversionQueue } from '../domain/conversion-queue';
import {
  completeQueue,
  markQueueCancelled,
  pauseQueue,
  requestQueueCancel,
  resumeQueue,
} from '../domain/conversion-queue';

export type ConversionOutputQueueExecutorConfig = {
  readonly preset: ConversionPreset;
  readonly fileRegistry: ImportedFileRegistry;
  readonly outputWriter: OutputWriterPort;
};

export function createConversionOutputQueueExecutor(
  converter: AudioConversionPort,
  clock: ClockPort,
  config: ConversionOutputQueueExecutorConfig,
): QueueExecutorPort {
  return {
    execute: (queue, options) => executeQueue(queue, options, converter, clock, config),
  };
}

function executeQueue(
  initialQueue: ConversionQueue,
  options: QueueExecutorOptions,
  converter: AudioConversionPort,
  clock: ClockPort,
  config: ConversionOutputQueueExecutorConfig,
): QueueExecutorControls {
  let queue = initialQueue;
  let cancelled = false;
  let paused = false;
  let activeIndex = 0;
  let runPromise: Promise<void> | undefined;
  let finished = false;

  function publish() {
    options.onSnapshot({ queue });
  }

  function setJob(index: number, job: ConversionJob) {
    queue = {
      ...queue,
      jobs: queue.jobs.map((existingJob, existingIndex) =>
        existingIndex === index ? job : existingJob,
      ),
    };
    publish();
  }

  function finish() {
    if (finished) return;

    const result = cancelled
      ? markQueueCancelled(queue, clock.now())
      : completeQueue(queue, clock.now());

    if (!result.ok) {
      options.onError(new Error(result.error.message));
      return;
    }

    queue = result.value;
    finished = true;
    publish();
    options.onComplete({ queue });
  }

  function scheduleRun() {
    if (runPromise !== undefined || finished) return;

    runPromise = run()
      .catch(options.onError)
      .finally(() => {
        runPromise = undefined;
        if (!paused && !finished && (cancelled || activeIndex < queue.jobs.length)) {
          scheduleRun();
        }
      });
  }

  async function run() {
    while (activeIndex < queue.jobs.length) {
      if (cancelled) {
        finish();
        return;
      }

      if (paused) return;

      const job = queue.jobs[activeIndex];
      if (job === undefined) break;

      if (job.status !== 'pending') {
        activeIndex += 1;
        continue;
      }

      await runJob(job, activeIndex);
      activeIndex += 1;
    }

    if (!paused) finish();
  }

  async function runJob(job: ConversionJob, index: number) {
    const file = config.fileRegistry.get(job.assetId);

    if (file === undefined) {
      markFailed(job, index, 'Missing source file reference for conversion.');
      return;
    }

    const inspecting = startInspection(job);
    if (!inspecting.ok) return markFailed(job, index, inspecting.error.message);
    setJob(index, inspecting.value);

    const ready = markReady(inspecting.value);
    if (!ready.ok) return markFailed(inspecting.value, index, ready.error.message);
    setJob(index, ready.value);

    const converting = startConversion(ready.value);
    if (!converting.ok) return markFailed(ready.value, index, converting.error.message);
    setJob(index, converting.value);

    try {
      const input = new Uint8Array(await file.arrayBuffer());
      if (isJobDismissed(index)) return;

      const command: AudioConversionCommand = {
        assetId: job.assetId,
        inputName: file.name,
        outputName: job.outputName,
        preset: config.preset,
      };
      const converted = await converter.convert(command, input, (event) => {
        const currentJob = queue.jobs[index];
        if (currentJob === undefined || currentJob.status !== 'converting') return;

        const progressed = updateProgress(currentJob, event.percent);
        if (progressed.ok) setJob(index, progressed.value);
      });
      if (isJobDismissed(index)) return;

      const writing = startWriting(queue.jobs[index] ?? converting.value);
      if (!writing.ok) return markFailed(converting.value, index, writing.error.message);
      setJob(index, writing.value);

      const writeResult = await config.outputWriter.writeFile({
        name: converted.outputName,
        data: converted.data,
        mimeType: converted.mimeType,
      });
      if (isJobDismissed(index)) return;

      const completed = completeJob(writing.value, writeResult.outputName);
      if (!completed.ok) return markFailed(writing.value, index, completed.error.message);
      setJob(index, completed.value);
    } catch (error) {
      if (isJobDismissed(index)) return;

      markFailed(
        queue.jobs[index] ?? converting.value,
        index,
        error instanceof Error ? error.message : 'Unknown conversion/write failure.',
      );
    }
  }

  function markFailed(job: ConversionJob, index: number, message: string) {
    const activeJob = ['pending', 'ready', 'completed', 'skipped', 'cancelled', 'failed'].includes(
      job.status,
    )
      ? { ...job, status: 'converting' as const }
      : job;
    const failed = failJob(activeJob, { type: 'conversion_failed', message, recoverable: true });

    if (failed.ok) setJob(index, failed.value);
  }

  function isJobDismissed(index: number): boolean {
    const job = queue.jobs[index];
    return job === undefined || ['skipped', 'cancelled'].includes(job.status);
  }

  function dismissJob(index: number) {
    const job = queue.jobs[index];
    if (job === undefined || ['completed', 'failed', 'skipped', 'cancelled'].includes(job.status)) {
      return;
    }

    if (job.status === 'pending' || job.status === 'ready') {
      const skipped = skipJob(job);
      if (skipped.ok) setJob(index, skipped.value);
      return;
    }

    if (index === activeIndex) {
      converter.cancel();
    }

    const cancelling = requestCancel(job);
    if (!cancelling.ok) return;

    const cancelledJob = markCancelled(cancelling.value);
    if (cancelledJob.ok) setJob(index, cancelledJob.value);
  }

  scheduleRun();

  return {
    pause: () => {
      if (paused || cancelled || finished) return;

      const result = pauseQueue(queue);
      if (!result.ok) return options.onError(new Error(result.error.message));

      paused = true;
      queue = result.value;
      publish();
    },
    resume: () => {
      if (!paused || cancelled || finished) return;

      const result = resumeQueue(queue);
      if (!result.ok) return options.onError(new Error(result.error.message));

      paused = false;
      queue = result.value;
      publish();
      scheduleRun();
    },
    cancel: () => {
      if (cancelled || finished) return;

      const result = requestQueueCancel(queue);
      if (!result.ok) return options.onError(new Error(result.error.message));

      cancelled = true;
      paused = false;
      queue = result.value;
      publish();
      converter.cancel();
      const activeJob = queue.jobs[activeIndex];
      if (activeJob !== undefined && activeJob.status === 'converting') {
        const cancelling = requestCancel(activeJob);
        if (cancelling.ok) {
          const cancelledJob = markCancelled(cancelling.value);
          if (cancelledJob.ok) setJob(activeIndex, cancelledJob.value);
        }
      }
      queue = {
        ...queue,
        jobs: queue.jobs.map((job) => {
          if (job.status !== 'pending' && job.status !== 'ready') return job;
          const cancelledJob = cancelUnstartedJob(job);
          return cancelledJob.ok ? cancelledJob.value : job;
        }),
      };
      publish();
      scheduleRun();
    },
    cancelJob: (jobId) => {
      const index = queue.jobs.findIndex((job) => job.id === jobId);
      if (index >= 0) dismissJob(index);
    },
  };
}
