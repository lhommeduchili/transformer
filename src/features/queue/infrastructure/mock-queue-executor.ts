import type { ClockPort } from '../../../shared/application/clock-port';
import { createProgressPercent } from '../../../shared/domain/numbers';
import {
  completeJob,
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
import type { ConversionQueue } from '../domain/conversion-queue';
import { completeQueue, markQueueCancelled } from '../domain/conversion-queue';
import type {
  QueueExecutorControls,
  QueueExecutorOptions,
  QueueExecutorPort,
} from '../application/queue-executor-port';

export type MockQueueExecutorConfig = {
  readonly tickMs: number;
  readonly progressSteps: readonly number[];
};

export function createMockQueueExecutor(
  clock: ClockPort,
  config: MockQueueExecutorConfig = { tickMs: 120, progressSteps: [20, 45, 70, 90] },
): QueueExecutorPort {
  return {
    execute: (initialQueue, options) => executeMockQueue(initialQueue, options, clock, config),
  };
}

function executeMockQueue(
  initialQueue: ConversionQueue,
  options: QueueExecutorOptions,
  clock: ClockPort,
  config: MockQueueExecutorConfig,
): QueueExecutorControls {
  let queue = initialQueue;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let continuation: (() => void) | undefined;
  let paused = false;
  let cancelled = false;
  let activeJobIndex = 0;

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

  function schedule(next: () => void) {
    continuation = next;
    timer = setTimeout(next, config.tickMs);
  }

  function finishCancelled() {
    const cancelledQueue = markQueueCancelled(queue, clock.now());

    if (!cancelledQueue.ok) {
      options.onError(new Error(cancelledQueue.error.message));
      return;
    }

    queue = cancelledQueue.value;
    publish();
    options.onComplete({ queue });
  }

  function finishCompleted() {
    const completedQueue = completeQueue(queue, clock.now());

    if (!completedQueue.ok) {
      options.onError(new Error(completedQueue.error.message));
      return;
    }

    queue = completedQueue.value;
    publish();
    options.onComplete({ queue });
  }

  function runNextJob() {
    if (paused) return;
    if (cancelled) {
      finishCancelled();
      return;
    }

    const job = queue.jobs[activeJobIndex];

    if (job === undefined) {
      finishCompleted();
      return;
    }

    if (job.status !== 'pending') {
      activeJobIndex += 1;
      schedule(runNextJob);
      return;
    }

    runJob(job, activeJobIndex, () => {
      activeJobIndex += 1;
      schedule(runNextJob);
    });
  }

  function runJob(job: ConversionJob, index: number, onDone: () => void) {
    const inspecting = startInspection(job);
    if (!inspecting.ok) return options.onError(new Error(inspecting.error.message));
    setJob(index, inspecting.value);

    schedule(() => {
      if (paused) return;
      if (cancelled) return cancelJob(inspecting.value, index);
      if (isJobDismissed(index)) return onDone();

      const ready = markReady(inspecting.value);
      if (!ready.ok) return options.onError(new Error(ready.error.message));
      setJob(index, ready.value);

      const converting = startConversion(ready.value);
      if (!converting.ok) return options.onError(new Error(converting.error.message));
      setJob(index, converting.value);
      runProgressSteps(converting.value, index, 0, onDone);
    });
  }

  function runProgressSteps(
    job: ConversionJob,
    index: number,
    stepIndex: number,
    onDone: () => void,
  ) {
    if (paused) return;
    if (cancelled) return cancelJob(job, index);
    if (isJobDismissed(index)) return onDone();

    const step = config.progressSteps[stepIndex];

    if (step === undefined) {
      const writing = startWriting(job);
      if (!writing.ok) return options.onError(new Error(writing.error.message));
      setJob(index, writing.value);

      schedule(() => {
        if (paused) return;
        if (cancelled) return cancelJob(writing.value, index);
        if (isJobDismissed(index)) return onDone();

        const completed = completeJob(writing.value);
        if (!completed.ok) return options.onError(new Error(completed.error.message));
        setJob(index, completed.value);
        onDone();
      });
      return;
    }

    const percent = createProgressPercent(step);
    if (!percent.ok) return options.onError(new Error(percent.error.type));

    const progressed = updateProgress(job, percent.value);
    if (!progressed.ok) return options.onError(new Error(progressed.error.message));
    setJob(index, progressed.value);

    schedule(() => runProgressSteps(progressed.value, index, stepIndex + 1, onDone));
  }

  function cancelJob(job: ConversionJob, index: number) {
    const cancelling = requestCancel(job);
    if (!cancelling.ok) return finishCancelled();

    const cancelledJob = markCancelled(cancelling.value);
    if (!cancelledJob.ok) return options.onError(new Error(cancelledJob.error.message));

    setJob(index, cancelledJob.value);
    finishCancelled();
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

    const cancelling = requestCancel(job);
    if (!cancelling.ok) return;

    const cancelledJob = markCancelled(cancelling.value);
    if (!cancelledJob.ok) return options.onError(new Error(cancelledJob.error.message));

    setJob(index, cancelledJob.value);

    if (index === activeJobIndex) {
      if (timer !== undefined) clearTimeout(timer);
      activeJobIndex += 1;
      schedule(runNextJob);
    }
  }

  schedule(runNextJob);

  return {
    pause: () => {
      paused = true;
      if (timer !== undefined) clearTimeout(timer);
    },
    resume: () => {
      if (!paused) return;
      paused = false;
      if (continuation !== undefined) {
        schedule(continuation);
      }
    },
    cancel: () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      schedule(runNextJob);
    },
    cancelJob: (jobId) => {
      const index = queue.jobs.findIndex((job) => job.id === jobId);
      if (index >= 0) dismissJob(index);
    },
  };
}
