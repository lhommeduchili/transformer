import type { ClockPort } from '../../../shared/application/clock-port';
import type { AudioConversionPort } from '../../conversion/application/audio-conversion-port';
import type { AudioConversionCommand } from '../../conversion/application/conversion-command';
import {
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
import type { ConversionPreset } from '../../presets/domain/conversion-preset';
import type { ConversionQueue } from '../domain/conversion-queue';
import { completeQueue, markQueueCancelled } from '../domain/conversion-queue';
import type {
  QueueExecutorControls,
  QueueExecutorOptions,
  QueueExecutorPort,
} from '../application/queue-executor-port';

export type ConversionQueueExecutorConfig = {
  readonly preset: ConversionPreset;
  readonly inputByAssetId: ReadonlyMap<string, Uint8Array>;
};

export function createConversionQueueExecutor(
  converter: AudioConversionPort,
  clock: ClockPort,
  config: ConversionQueueExecutorConfig,
): QueueExecutorPort {
  return {
    execute: (queue, options) => executeConversionQueue(queue, options, converter, clock, config),
  };
}

function executeConversionQueue(
  initialQueue: ConversionQueue,
  options: QueueExecutorOptions,
  converter: AudioConversionPort,
  clock: ClockPort,
  config: ConversionQueueExecutorConfig,
): QueueExecutorControls {
  let queue = initialQueue;
  let cancelled = false;
  let paused = false;
  let activeIndex = 0;

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
    const completed = cancelled
      ? markQueueCancelled(queue, clock.now())
      : completeQueue(queue, clock.now());

    if (!completed.ok) {
      options.onError(new Error(completed.error.message));
      return;
    }

    queue = completed.value;
    publish();
    options.onComplete({ queue });
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

    finish();
  }

  async function runJob(job: ConversionJob, index: number) {
    const input = config.inputByAssetId.get(job.assetId);

    if (input === undefined) {
      const failed = failJob(
        { ...job, status: 'converting' },
        {
          type: 'conversion_failed',
          message: 'Missing input bytes for conversion.',
          recoverable: true,
        },
      );

      if (failed.ok) setJob(index, failed.value);
      return;
    }

    const inspecting = startInspection(job);
    if (!inspecting.ok) throw new Error(inspecting.error.message);
    setJob(index, inspecting.value);

    const ready = markReady(inspecting.value);
    if (!ready.ok) throw new Error(ready.error.message);
    setJob(index, ready.value);

    const converting = startConversion(ready.value);
    if (!converting.ok) throw new Error(converting.error.message);
    setJob(index, converting.value);

    try {
      const command: AudioConversionCommand = {
        assetId: job.assetId,
        inputName: `${job.assetId}.input`,
        outputName: job.outputName,
        preset: config.preset,
      };

      await converter.convert(command, input, (event) => {
        const currentJob = queue.jobs[index];
        if (currentJob === undefined || currentJob.status !== 'converting') return;

        const progressed = updateProgress(currentJob, event.percent);
        if (progressed.ok) setJob(index, progressed.value);
      });
      if (isJobDismissed(index)) return;

      const currentJob = queue.jobs[index];
      if (currentJob === undefined) return;

      const writing = startWriting(currentJob);
      if (!writing.ok) throw new Error(writing.error.message);
      setJob(index, writing.value);

      const completed = completeJob(writing.value);
      if (!completed.ok) throw new Error(completed.error.message);
      setJob(index, completed.value);
    } catch (error) {
      if (isJobDismissed(index)) return;

      const currentJob = queue.jobs[index];
      if (currentJob === undefined) return;

      const failed = failJob(currentJob, {
        type: 'conversion_failed',
        message: error instanceof Error ? error.message : 'Unknown conversion failure.',
        recoverable: true,
      });

      if (failed.ok) setJob(index, failed.value);
    }
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

  void run().catch(options.onError);

  return {
    pause: () => {
      paused = true;
    },
    resume: () => {
      if (!paused) return;
      paused = false;
      void run().catch(options.onError);
    },
    cancel: () => {
      cancelled = true;
      converter.cancel();
      const activeJob = queue.jobs[activeIndex];
      if (activeJob !== undefined && activeJob.status === 'converting') {
        const cancelling = requestCancel(activeJob);
        if (cancelling.ok) {
          const cancelledJob = markCancelled(cancelling.value);
          if (cancelledJob.ok) setJob(activeIndex, cancelledJob.value);
        }
      }
    },
    cancelJob: (jobId) => {
      const index = queue.jobs.findIndex((job) => job.id === jobId);
      if (index >= 0) dismissJob(index);
    },
  };
}
