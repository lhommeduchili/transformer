import type { DateTimeIso } from '../../../shared/domain/date-time';
import type { QueueId } from '../../../shared/domain/ids';
import { err, ok, type Result } from '../../../shared/domain/result';
import type { ConversionError } from '../../conversion/domain/conversion-error';
import { retryJob, type ConversionJob } from '../../conversion/domain/conversion-job';
import type { QueueStatus } from './queue-status';

export type ConversionQueue = {
  readonly id: QueueId;
  readonly jobs: readonly ConversionJob[];
  readonly status: QueueStatus;
  readonly createdAt: DateTimeIso;
  readonly startedAt?: DateTimeIso;
  readonly completedAt?: DateTimeIso;
  readonly errors: readonly ConversionError[];
};

export type ConversionQueueError =
  | {
      readonly type: 'invalid_queue_transition';
      readonly message: string;
      readonly from: QueueStatus;
      readonly to: QueueStatus;
    }
  | {
      readonly type: 'empty_queue';
      readonly message: string;
    }
  | {
      readonly type: 'no_failed_jobs';
      readonly message: string;
    };

export function createQueue(
  input: Pick<ConversionQueue, 'id' | 'jobs' | 'createdAt'>,
): ConversionQueue {
  return {
    ...input,
    status: 'idle',
    errors: [],
  };
}

function invalidQueueTransition(from: QueueStatus, to: QueueStatus): ConversionQueueError {
  return {
    type: 'invalid_queue_transition',
    message: `Cannot transition queue from ${from} to ${to}.`,
    from,
    to,
  };
}

function transitionQueue(
  queue: ConversionQueue,
  to: QueueStatus,
  allowedFrom: readonly QueueStatus[],
  patch: Partial<ConversionQueue> = {},
): Result<ConversionQueue, ConversionQueueError> {
  if (!allowedFrom.includes(queue.status)) {
    return err(invalidQueueTransition(queue.status, to));
  }

  return ok({ ...queue, ...patch, status: to });
}

export function startQueue(
  queue: ConversionQueue,
  startedAt: DateTimeIso,
): Result<ConversionQueue, ConversionQueueError> {
  if (queue.jobs.length === 0) {
    return err({ type: 'empty_queue', message: 'Queue must contain at least one job.' });
  }

  return transitionQueue(queue, 'running', ['idle'], { startedAt });
}

export function pauseQueue(queue: ConversionQueue): Result<ConversionQueue, ConversionQueueError> {
  return transitionQueue(queue, 'paused', ['running']);
}

export function resumeQueue(queue: ConversionQueue): Result<ConversionQueue, ConversionQueueError> {
  return transitionQueue(queue, 'running', ['paused']);
}

export function requestQueueCancel(
  queue: ConversionQueue,
): Result<ConversionQueue, ConversionQueueError> {
  return transitionQueue(queue, 'cancelling', ['running', 'paused']);
}

export function prepareQueueRetry(
  queue: ConversionQueue,
): Result<ConversionQueue, ConversionQueueError> {
  if (!['completed_with_errors', 'failed'].includes(queue.status)) {
    return err(invalidQueueTransition(queue.status, 'idle'));
  }

  let retriedCount = 0;
  const jobs = queue.jobs.map((job) => {
    if (job.status !== 'failed') return job;

    const retried = retryJob(job);
    if (!retried.ok) return job;

    retriedCount += 1;
    return retried.value;
  });

  if (retriedCount === 0) {
    return err({ type: 'no_failed_jobs', message: 'Queue has no failed jobs to retry.' });
  }

  return ok({
    id: queue.id,
    jobs,
    status: 'idle',
    createdAt: queue.createdAt,
    errors: [],
  });
}

export function markQueueCancelled(
  queue: ConversionQueue,
  completedAt: DateTimeIso,
): Result<ConversionQueue, ConversionQueueError> {
  return transitionQueue(queue, 'cancelled', ['cancelling'], { completedAt });
}

export function completeQueue(
  queue: ConversionQueue,
  completedAt: DateTimeIso,
): Result<ConversionQueue, ConversionQueueError> {
  const hasFailedJobs = queue.jobs.some((job) => job.status === 'failed');
  const status: QueueStatus = hasFailedJobs ? 'completed_with_errors' : 'completed';

  return transitionQueue(queue, status, ['running'], { completedAt });
}

export function failQueue(
  queue: ConversionQueue,
  errorValue: ConversionError,
): Result<ConversionQueue, ConversionQueueError> {
  return transitionQueue(queue, 'failed', ['running'], { errors: [...queue.errors, errorValue] });
}
