import type { ConversionQueue } from '../domain/conversion-queue';

export type QueueProgressSummary = {
  readonly total: number;
  readonly pending: number;
  readonly active: number;
  readonly completed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly cancelled: number;
  readonly globalPercent: number;
};

export function calculateQueueProgress(queue: ConversionQueue | undefined): QueueProgressSummary {
  if (queue === undefined || queue.jobs.length === 0) {
    return {
      total: 0,
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      cancelled: 0,
      globalPercent: 0,
    };
  }

  const counts = queue.jobs.reduce(
    (summary, job) => {
      const terminalProgress = ['completed', 'failed', 'skipped', 'cancelled'].includes(job.status)
        ? 100
        : job.progress.percent;

      return {
        pending: summary.pending + (job.status === 'pending' || job.status === 'ready' ? 1 : 0),
        active:
          summary.active +
          (['inspecting', 'converting', 'writing', 'cancelling'].includes(job.status) ? 1 : 0),
        completed: summary.completed + (job.status === 'completed' ? 1 : 0),
        failed: summary.failed + (job.status === 'failed' ? 1 : 0),
        skipped: summary.skipped + (job.status === 'skipped' ? 1 : 0),
        cancelled: summary.cancelled + (job.status === 'cancelled' ? 1 : 0),
        totalProgress: summary.totalProgress + terminalProgress,
      };
    },
    {
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      cancelled: 0,
      totalProgress: 0,
    },
  );

  return {
    total: queue.jobs.length,
    pending: counts.pending,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    skipped: counts.skipped,
    cancelled: counts.cancelled,
    globalPercent: Math.round(counts.totalProgress / queue.jobs.length),
  };
}
