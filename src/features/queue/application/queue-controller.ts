import type { ClockPort } from '../../../shared/application/clock-port';
import type { ConversionQueue } from '../domain/conversion-queue';
import {
  pauseQueue,
  requestQueueCancel,
  resumeQueue,
  startQueue,
} from '../domain/conversion-queue';

export function startPlannedQueue(queue: ConversionQueue, clock: ClockPort): ConversionQueue {
  const started = startQueue(queue, clock.now());

  if (!started.ok) {
    throw new Error(started.error.message);
  }

  return started.value;
}

export function pauseRunningQueue(queue: ConversionQueue): ConversionQueue {
  const paused = pauseQueue(queue);

  if (!paused.ok) {
    throw new Error(paused.error.message);
  }

  return paused.value;
}

export function resumePausedQueue(queue: ConversionQueue): ConversionQueue {
  const resumed = resumeQueue(queue);

  if (!resumed.ok) {
    throw new Error(resumed.error.message);
  }

  return resumed.value;
}

export function cancelRunningQueue(queue: ConversionQueue): ConversionQueue {
  const cancelling = requestQueueCancel(queue);

  if (!cancelling.ok) {
    throw new Error(cancelling.error.message);
  }

  return cancelling.value;
}
