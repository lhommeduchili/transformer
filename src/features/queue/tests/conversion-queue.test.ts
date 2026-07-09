import { describe, expect, it } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import {
  createAudioAssetId,
  createConversionJobId,
  createPresetId,
  createQueueId,
} from '../../../shared/domain/ids';
import {
  createConversionJob,
  failJob,
  startInspection,
} from '../../conversion/domain/conversion-job';
import {
  completeQueue,
  createQueue,
  pauseQueue,
  resumeQueue,
  startQueue,
} from '../domain/conversion-queue';

function iso(value: string) {
  const dateTime = createDateTimeIso(value);
  if (!dateTime.ok) throw new Error('Invalid fixture.');
  return dateTime.value;
}

function job() {
  const id = createConversionJobId('job-1');
  const assetId = createAudioAssetId('asset-1');
  const presetId = createPresetId('preset-1');

  if (!id.ok || !assetId.ok || !presetId.ok) throw new Error('Invalid fixture.');

  const conversionJob = createConversionJob({
    id: id.value,
    assetId: assetId.value,
    presetId: presetId.value,
    outputName: 'track.mp3',
  });

  if (!conversionJob.ok) throw new Error('Invalid fixture.');
  return conversionJob.value;
}

function queueWithJobs() {
  const id = createQueueId('queue-1');
  if (!id.ok) throw new Error('Invalid fixture.');

  return createQueue({ id: id.value, jobs: [job()], createdAt: iso('2026-06-24T00:00:00.000Z') });
}

describe('conversion queue state machine', () => {
  it('starts, pauses, and resumes a queue', () => {
    const running = startQueue(queueWithJobs(), iso('2026-06-24T00:00:01.000Z'));
    if (!running.ok) throw new Error('Expected running.');

    const paused = pauseQueue(running.value);
    if (!paused.ok) throw new Error('Expected paused.');

    const resumed = resumeQueue(paused.value);

    expect(resumed.ok).toBe(true);
    if (!resumed.ok) throw new Error('Expected resumed.');
    expect(resumed.value.status).toBe('running');
  });

  it('rejects starting an empty queue', () => {
    const id = createQueueId('queue-1');
    if (!id.ok) throw new Error('Invalid fixture.');

    const queue = createQueue({
      id: id.value,
      jobs: [],
      createdAt: iso('2026-06-24T00:00:00.000Z'),
    });
    const result = startQueue(queue, iso('2026-06-24T00:00:01.000Z'));

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected empty queue error.');
    expect(result.error.type).toBe('empty_queue');
  });

  it('completes with errors when a job failed', () => {
    const inspecting = startInspection(job());
    if (!inspecting.ok) throw new Error('Expected inspecting.');

    const failedJob = failJob(inspecting.value, {
      type: 'inspection_failed',
      message: 'Could not inspect file.',
      recoverable: true,
    });
    if (!failedJob.ok) throw new Error('Expected failed job.');

    const id = createQueueId('queue-1');
    if (!id.ok) throw new Error('Invalid fixture.');

    const queue = createQueue({
      id: id.value,
      jobs: [failedJob.value],
      createdAt: iso('2026-06-24T00:00:00.000Z'),
    });
    const running = startQueue(queue, iso('2026-06-24T00:00:01.000Z'));
    if (!running.ok) throw new Error('Expected running.');

    const completed = completeQueue(running.value, iso('2026-06-24T00:00:02.000Z'));

    expect(completed.ok).toBe(true);
    if (!completed.ok) throw new Error('Expected completed.');
    expect(completed.value.status).toBe('completed_with_errors');
  });
});
