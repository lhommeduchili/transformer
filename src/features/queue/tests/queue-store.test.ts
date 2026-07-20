import { describe, expect, it } from 'vitest';

import type { ClockPort } from '../../../shared/application/clock-port';
import { createDateTimeIso } from '../../../shared/domain/date-time';
import {
  createAudioAssetId,
  createConversionJobId,
  createQueueId,
} from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import type { AudioAsset } from '../../import/domain/audio-asset';
import { getDefaultPreset } from '../../presets/domain/built-in-presets';
import { previewOutputFilenames } from '../../presets/domain/output-filename-preview';
import { createQueueStore } from '../application/queue-store';
import type { QueueExecutorPort } from '../application/queue-executor-port';

function fixture() {
  const queueId = createQueueId('queue-1');
  const jobId = createConversionJobId('job-1');
  const assetId = createAudioAssetId('asset-1');
  const sizeBytes = createFileSizeBytes(1000);
  const now = createDateTimeIso('2026-07-19T00:00:00.000Z');
  if (!queueId.ok || !jobId.ok || !assetId.ok || !sizeBytes.ok || !now.ok) {
    throw new Error('Invalid fixture.');
  }
  const asset: AudioAsset = {
    id: assetId.value,
    sourceName: 'Track.flac',
    sizeBytes: sizeBytes.value,
    extension: 'flac',
    importedAt: now.value,
  };
  const clock: ClockPort = { now: () => now.value };

  return { queueId: queueId.value, jobId: jobId.value, asset, clock };
}

describe('queue store', () => {
  it('returns failed jobs to a startable queue', () => {
    const { queueId, jobId, asset, clock } = fixture();
    const executor: QueueExecutorPort = {
      execute: (queue, options) => {
        const failedJob = {
          ...queue.jobs[0]!,
          status: 'failed' as const,
          errors: [
            { type: 'conversion_failed' as const, message: 'Failed.', recoverable: true as const },
          ],
        };
        options.onComplete({
          queue: {
            ...queue,
            jobs: [failedJob],
            status: 'completed_with_errors',
            completedAt: clock.now(),
          },
        });
        return {
          pause: () => undefined,
          resume: () => undefined,
          cancel: () => undefined,
          cancelJob: () => undefined,
        };
      },
    };
    const store = createQueueStore({
      queueIdGenerator: { nextId: () => queueId },
      jobIdGenerator: { nextId: () => jobId },
      clock,
      executor,
    });
    const preset = getDefaultPreset();
    store.getState().planQueue(previewOutputFilenames([asset], preset), preset);
    store.getState().startQueue();

    expect(store.getState().queue?.status).toBe('completed_with_errors');
    store.getState().retryFailedJobs();

    expect(store.getState().queue?.status).toBe('idle');
    expect(store.getState().queue?.jobs[0]?.status).toBe('pending');
  });

  it('ignores executor snapshots after the queue is reset', () => {
    const { queueId, jobId, asset, clock } = fixture();
    let complete!: Parameters<QueueExecutorPort['execute']>[1]['onComplete'];
    const executor: QueueExecutorPort = {
      execute: (_queue, options) => {
        complete = options.onComplete;
        return {
          pause: () => undefined,
          resume: () => undefined,
          cancel: () => undefined,
          cancelJob: () => undefined,
        };
      },
    };
    const store = createQueueStore({
      queueIdGenerator: { nextId: () => queueId },
      jobIdGenerator: { nextId: () => jobId },
      clock,
      executor,
    });
    const preset = getDefaultPreset();
    store.getState().planQueue(previewOutputFilenames([asset], preset), preset);
    store.getState().startQueue();
    const runningQueue = store.getState().queue;
    if (runningQueue === undefined) throw new Error('Expected running queue.');

    store.getState().resetQueue();
    complete({ queue: { ...runningQueue, status: 'cancelled' } });

    expect(store.getState().queue).toBeUndefined();
  });
});
