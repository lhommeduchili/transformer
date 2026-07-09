import { create } from 'zustand';

import type { ClockPort } from '../../../shared/application/clock-port';
import type { IdGeneratorPort } from '../../../shared/application/id-generator-port';
import type { ConversionJobId, QueueId } from '../../../shared/domain/ids';
import { retryJob, skipJob } from '../../conversion/domain/conversion-job';
import type { ConversionPreset } from '../../presets/domain/conversion-preset';
import type { OutputFilenamePreview } from '../../presets/domain/output-filename-preview';
import type { ConversionQueue } from '../domain/conversion-queue';
import {
  cancelRunningQueue,
  pauseRunningQueue,
  resumePausedQueue,
  startPlannedQueue,
} from './queue-controller';
import type { QueueExecutorControls, QueueExecutorPort } from './queue-executor-port';
import { planConversionQueue } from './plan-conversion-queue';

export type QueueStoreState = {
  readonly queue: ConversionQueue | undefined;
  readonly error: string | undefined;
  readonly planQueue: (
    previews: readonly OutputFilenamePreview[],
    preset: ConversionPreset,
  ) => void;
  readonly startQueue: () => void;
  readonly pauseQueue: () => void;
  readonly resumeQueue: () => void;
  readonly cancelQueue: () => void;
  readonly skipJob: (jobId: ConversionJobId) => void;
  readonly retryFailedJobs: () => void;
  readonly resetQueue: () => void;
};

export type QueueStoreDependencies = {
  readonly queueIdGenerator: IdGeneratorPort<QueueId>;
  readonly jobIdGenerator: IdGeneratorPort<ConversionJobId>;
  readonly clock: ClockPort;
  readonly executor: QueueExecutorPort;
};

export function createQueueStore(dependencies: QueueStoreDependencies) {
  let controls: QueueExecutorControls | undefined;

  return create<QueueStoreState>((set, get) => ({
    queue: undefined,
    error: undefined,

    planQueue: (previews, preset) => {
      const planned = planConversionQueue(previews, preset, dependencies);

      if (!planned.ok) {
        set({ error: planned.error.message });
        return;
      }

      controls?.cancel();
      controls = undefined;
      set({ queue: planned.value, error: undefined });
    },

    startQueue: () => {
      const queue = get().queue;
      if (queue === undefined) return;

      try {
        const runningQueue = startPlannedQueue(queue, dependencies.clock);
        set({ queue: runningQueue, error: undefined });
        controls = dependencies.executor.execute(runningQueue, {
          onSnapshot: (snapshot) => set({ queue: snapshot.queue }),
          onComplete: (snapshot) => {
            controls = undefined;
            set({ queue: snapshot.queue });
          },
          onError: (error) => set({ error: error.message }),
        });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unable to start queue.' });
      }
    },

    pauseQueue: () => {
      const queue = get().queue;
      if (queue === undefined) return;

      try {
        controls?.pause();
        set({ queue: pauseRunningQueue(queue), error: undefined });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unable to pause queue.' });
      }
    },

    resumeQueue: () => {
      const queue = get().queue;
      if (queue === undefined) return;

      try {
        set({ queue: resumePausedQueue(queue), error: undefined });
        controls?.resume();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unable to resume queue.' });
      }
    },

    cancelQueue: () => {
      const queue = get().queue;
      if (queue === undefined) return;

      try {
        set({ queue: cancelRunningQueue(queue), error: undefined });
        controls?.cancel();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unable to cancel queue.' });
      }
    },

    skipJob: (jobId) => {
      const queue = get().queue;
      if (queue === undefined) return;

      if (queue.status === 'running' || queue.status === 'paused') {
        controls?.cancelJob(jobId);
        return;
      }

      if (queue.status !== 'idle') return;

      set({
        queue: {
          ...queue,
          jobs: queue.jobs.map((job) => {
            if (job.id !== jobId) return job;

            const skipped = skipJob(job);
            return skipped.ok ? skipped.value : job;
          }),
        },
      });
    },

    retryFailedJobs: () => {
      const queue = get().queue;
      if (queue === undefined || queue.status === 'running') return;

      set({
        queue: {
          ...queue,
          jobs: queue.jobs.map((job) => {
            if (job.status !== 'failed') return job;

            const retried = retryJob(job);
            return retried.ok ? retried.value : job;
          }),
        },
      });
    },

    resetQueue: () => {
      controls?.cancel();
      controls = undefined;
      set({ queue: undefined, error: undefined });
    },
  }));
}
