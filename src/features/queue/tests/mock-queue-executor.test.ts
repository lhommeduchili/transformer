import { describe, expect, it, vi } from 'vitest';

import type { ClockPort } from '../../../shared/application/clock-port';
import { createDateTimeIso } from '../../../shared/domain/date-time';
import {
  createAudioAssetId,
  createConversionJobId,
  createPresetId,
  createQueueId,
} from '../../../shared/domain/ids';
import { createConversionJob } from '../../conversion/domain/conversion-job';
import { createQueue, startQueue } from '../domain/conversion-queue';
import { createMockQueueExecutor } from '../infrastructure/mock-queue-executor';
import type { QueueExecutionSnapshot } from '../application/queue-executor-port';

function clock(): ClockPort {
  const now = createDateTimeIso('2026-06-24T00:00:00.000Z');
  if (!now.ok) throw new Error('Invalid fixture.');
  return { now: () => now.value };
}

function runningQueue() {
  const queueId = createQueueId('queue-1');
  const jobId = createConversionJobId('job-1');
  const assetId = createAudioAssetId('asset-1');
  const presetId = createPresetId('preset-1');
  const createdAt = createDateTimeIso('2026-06-24T00:00:00.000Z');

  if (!queueId.ok || !jobId.ok || !assetId.ok || !presetId.ok || !createdAt.ok) {
    throw new Error('Invalid fixture.');
  }

  const job = createConversionJob({
    id: jobId.value,
    assetId: assetId.value,
    presetId: presetId.value,
    outputName: 'Track.aiff',
  });
  if (!job.ok) throw new Error('Invalid fixture.');

  const queue = createQueue({ id: queueId.value, jobs: [job.value], createdAt: createdAt.value });
  const running = startQueue(queue, createdAt.value);
  if (!running.ok) throw new Error('Invalid fixture.');

  return running.value;
}

describe('mock queue executor', () => {
  it('completes a queued job', async () => {
    vi.useFakeTimers();

    const completed = vi.fn<(snapshot: QueueExecutionSnapshot) => void>();
    createMockQueueExecutor(clock(), { tickMs: 1, progressSteps: [50] }).execute(runningQueue(), {
      onSnapshot: () => undefined,
      onComplete: completed,
      onError: (error) => {
        throw error;
      },
    });

    await vi.runAllTimersAsync();

    expect(completed).toHaveBeenCalledOnce();
    expect(completed.mock.calls[0]?.[0].queue.status).toBe('completed');

    vi.useRealTimers();
  });
});
