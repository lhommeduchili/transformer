import { describe, expect, it } from 'vitest';

import type { ClockPort } from '../../../shared/application/clock-port';
import type { IdGeneratorPort } from '../../../shared/application/id-generator-port';
import { createDateTimeIso } from '../../../shared/domain/date-time';
import {
  createAudioAssetId,
  createConversionJobId,
  createQueueId,
  type ConversionJobId,
  type QueueId,
} from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import { performanceBudgets } from '../../../shared/domain/performance-budgets';
import type { AudioAsset } from '../../import/domain/audio-asset';
import { getDefaultPreset } from '../../presets/domain/built-in-presets';
import { previewOutputFilenames } from '../../presets/domain/output-filename-preview';
import { planConversionQueue } from '../application/plan-conversion-queue';

function fixtureAsset(): AudioAsset {
  const id = createAudioAssetId('asset-1');
  const sizeBytes = createFileSizeBytes(1000);
  const importedAt = createDateTimeIso('2026-06-24T00:00:00.000Z');

  if (!id.ok || !sizeBytes.ok || !importedAt.ok) throw new Error('Invalid fixture.');

  return {
    id: id.value,
    sourceName: 'Track.flac',
    sizeBytes: sizeBytes.value,
    extension: 'flac',
    importedAt: importedAt.value,
  };
}

function fixtureAssetAt(index: number): AudioAsset {
  const id = createAudioAssetId(`asset-${index}`);
  const sizeBytes = createFileSizeBytes(1000 + index);
  const importedAt = createDateTimeIso('2026-06-24T00:00:00.000Z');

  if (!id.ok || !sizeBytes.ok || !importedAt.ok) throw new Error('Invalid fixture.');

  return {
    id: id.value,
    sourceName: `Artist ${index} - Track ${index}.flac`,
    sizeBytes: sizeBytes.value,
    extension: 'flac',
    importedAt: importedAt.value,
  };
}

function dependencies(): {
  readonly queueIdGenerator: IdGeneratorPort<QueueId>;
  readonly jobIdGenerator: IdGeneratorPort<ConversionJobId>;
  readonly clock: ClockPort;
} {
  const queueId = createQueueId('queue-1');
  const jobId = createConversionJobId('job-1');
  const now = createDateTimeIso('2026-06-24T00:00:01.000Z');

  if (!queueId.ok || !jobId.ok || !now.ok) throw new Error('Invalid fixture.');

  return {
    queueIdGenerator: { nextId: () => queueId.value },
    jobIdGenerator: { nextId: () => jobId.value },
    clock: { now: () => now.value },
  };
}

describe('planConversionQueue', () => {
  it('creates one pending job per output filename preview', () => {
    const preset = getDefaultPreset();
    const previews = previewOutputFilenames([fixtureAsset()], preset);
    const planned = planConversionQueue(previews, preset, dependencies());

    expect(planned.ok).toBe(true);
    if (!planned.ok) throw new Error('Expected queue.');
    expect(planned.value.jobs).toHaveLength(1);
    expect(planned.value.jobs[0]?.outputName).toBe('Track.aiff');
    expect(planned.value.jobs[0]?.status).toBe('pending');
  });

  it('rejects empty plans', () => {
    const planned = planConversionQueue([], getDefaultPreset(), dependencies());

    expect(planned.ok).toBe(false);
  });

  it('plans a 1,000 item queue with preserved artist-title filenames', () => {
    let nextJobId = 0;
    const queueId = createQueueId('large-queue');
    const now = createDateTimeIso('2026-06-24T00:00:01.000Z');
    if (!queueId.ok || !now.ok) throw new Error('Invalid fixture.');
    const preset = getDefaultPreset();
    const assets = Array.from({ length: performanceBudgets.minimumUsableQueueSize }, (_, index) =>
      fixtureAssetAt(index + 1),
    );
    const previews = previewOutputFilenames(assets, preset);
    const planned = planConversionQueue(previews, preset, {
      queueIdGenerator: { nextId: () => queueId.value },
      jobIdGenerator: {
        nextId: () => {
          nextJobId += 1;
          const id = createConversionJobId(`job-${nextJobId}`);
          if (!id.ok) throw new Error('Invalid fixture.');
          return id.value;
        },
      },
      clock: { now: () => now.value },
    });

    expect(planned.ok).toBe(true);
    if (!planned.ok) throw new Error('Expected queue.');
    expect(planned.value.jobs).toHaveLength(performanceBudgets.minimumUsableQueueSize);
    expect(planned.value.jobs[0]?.outputName).toBe('Artist 1 - Track 1.aiff');
    expect(planned.value.jobs[999]?.outputName).toBe('Artist 1000 - Track 1000.aiff');
  });
});
