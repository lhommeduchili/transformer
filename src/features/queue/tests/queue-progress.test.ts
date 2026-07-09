import { describe, expect, it } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import {
  createAudioAssetId,
  createConversionJobId,
  createPresetId,
  createQueueId,
} from '../../../shared/domain/ids';
import { createProgressPercent } from '../../../shared/domain/numbers';
import {
  createConversionJob,
  startInspection,
  markReady,
  startConversion,
  updateProgress,
} from '../../conversion/domain/conversion-job';
import { createQueue } from '../domain/conversion-queue';
import { calculateQueueProgress } from '../application/queue-progress';

function queue() {
  const queueId = createQueueId('queue-1');
  const jobId = createConversionJobId('job-1');
  const assetId = createAudioAssetId('asset-1');
  const presetId = createPresetId('preset-1');
  const createdAt = createDateTimeIso('2026-06-24T00:00:00.000Z');
  const percent = createProgressPercent(50);

  if (!queueId.ok || !jobId.ok || !assetId.ok || !presetId.ok || !createdAt.ok || !percent.ok) {
    throw new Error('Invalid fixture.');
  }

  const job = createConversionJob({
    id: jobId.value,
    assetId: assetId.value,
    presetId: presetId.value,
    outputName: 'Track.aiff',
  });
  if (!job.ok) throw new Error('Invalid fixture.');

  const inspecting = startInspection(job.value);
  if (!inspecting.ok) throw new Error('Invalid fixture.');
  const ready = markReady(inspecting.value);
  if (!ready.ok) throw new Error('Invalid fixture.');
  const converting = startConversion(ready.value);
  if (!converting.ok) throw new Error('Invalid fixture.');
  const progressed = updateProgress(converting.value, percent.value);
  if (!progressed.ok) throw new Error('Invalid fixture.');

  return createQueue({ id: queueId.value, jobs: [progressed.value], createdAt: createdAt.value });
}

describe('calculateQueueProgress', () => {
  it('aggregates active job progress', () => {
    const summary = calculateQueueProgress(queue());

    expect(summary.total).toBe(1);
    expect(summary.active).toBe(1);
    expect(summary.globalPercent).toBe(50);
  });
});
