import { describe, expect, it } from 'vitest';

import {
  createAudioAssetId,
  createConversionJobId,
  createPresetId,
} from '../../../shared/domain/ids';
import { createProgressPercent } from '../../../shared/domain/numbers';
import {
  completeJob,
  createConversionJob,
  failJob,
  markReady,
  markCancelled,
  requestCancel,
  retryJob,
  startConversion,
  startInspection,
  startWriting,
  updateProgress,
} from '../domain/conversion-job';

function validJob() {
  const id = createConversionJobId('job-1');
  const assetId = createAudioAssetId('asset-1');
  const presetId = createPresetId('preset-1');

  if (!id.ok || !assetId.ok || !presetId.ok) throw new Error('Invalid fixture.');

  const job = createConversionJob({
    id: id.value,
    assetId: assetId.value,
    presetId: presetId.value,
    outputName: 'track.mp3',
  });

  if (!job.ok) throw new Error('Invalid fixture.');
  return job.value;
}

describe('conversion job state machine', () => {
  it('supports the happy path from pending to completed', () => {
    const inspecting = startInspection(validJob());
    if (!inspecting.ok) throw new Error('Expected inspecting.');

    const ready = markReady(inspecting.value);
    if (!ready.ok) throw new Error('Expected ready.');

    const converting = startConversion(ready.value);
    if (!converting.ok) throw new Error('Expected converting.');

    const progress = createProgressPercent(42);
    if (!progress.ok) throw new Error('Invalid fixture.');

    const progressed = updateProgress(converting.value, progress.value);
    if (!progressed.ok) throw new Error('Expected progress update.');

    const writing = startWriting(progressed.value);
    if (!writing.ok) throw new Error('Expected writing.');

    const completed = completeJob(writing.value);

    expect(completed.ok).toBe(true);
    if (!completed.ok) throw new Error('Expected completed.');
    expect(completed.value.status).toBe('completed');
    expect(completed.value.progress.phase).toBe('completed');
  });

  it('rejects invalid transitions', () => {
    const result = startConversion(validJob());

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected invalid transition.');
    expect(result.error.type).toBe('invalid_transition');
  });

  it('allows failed jobs to be retried', () => {
    const inspecting = startInspection(validJob());
    if (!inspecting.ok) throw new Error('Expected inspecting.');

    const failed = failJob(inspecting.value, {
      type: 'inspection_failed',
      message: 'Could not inspect file.',
      recoverable: true,
    });
    if (!failed.ok) throw new Error('Expected failed.');

    const retried = retryJob(failed.value);

    expect(retried.ok).toBe(true);
    if (!retried.ok) throw new Error('Expected retried.');
    expect(retried.value.status).toBe('pending');
  });

  it('allows active jobs to be cancelled', () => {
    const inspecting = startInspection(validJob());
    if (!inspecting.ok) throw new Error('Expected inspecting.');
    const cancelling = requestCancel(inspecting.value);
    if (!cancelling.ok) throw new Error('Expected cancelling.');

    const cancelled = markCancelled(cancelling.value);

    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) throw new Error('Expected cancelled.');
    expect(cancelled.value.status).toBe('cancelled');
  });
});
