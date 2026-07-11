import { describe, expect, it } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import {
  createAudioAssetId,
  createConversionJobId,
  createPresetId,
  createQueueId,
} from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import { performanceBudgets } from '../../../shared/domain/performance-budgets';
import { createConversionJob } from '../../conversion/domain/conversion-job';
import type { AudioAsset } from '../../import/domain/audio-asset';
import { getDefaultPreset } from '../../presets/domain/built-in-presets';
import { createQueue } from '../../queue/domain/conversion-queue';
import { buildConversionReport } from '../application/build-conversion-report';

function iso(value: string) {
  const dateTime = createDateTimeIso(value);
  if (!dateTime.ok) throw new Error('Invalid fixture.');
  return dateTime.value;
}

function fixtureAsset(): AudioAsset {
  const id = createAudioAssetId('asset-1');
  const sizeBytes = createFileSizeBytes(1000);

  if (!id.ok || !sizeBytes.ok) throw new Error('Invalid fixture.');

  return {
    id: id.value,
    sourceName: 'Track.flac',
    sizeBytes: sizeBytes.value,
    extension: 'flac',
    importedAt: iso('2026-06-26T00:00:00.000Z'),
  };
}

function fixtureJob(asset: AudioAsset) {
  const id = createConversionJobId('job-1');
  const presetId = createPresetId('cdj_rekordbox_safe_aiff');

  if (!id.ok || !presetId.ok) throw new Error('Invalid fixture.');

  const job = createConversionJob({
    id: id.value,
    assetId: asset.id,
    presetId: presetId.value,
    outputName: 'Track.aiff',
  });

  if (!job.ok) throw new Error('Invalid fixture.');
  return { ...job.value, status: 'completed' as const };
}

function fixtureAssetAt(index: number): AudioAsset {
  const id = createAudioAssetId(`asset-${index}`);
  const sizeBytes = createFileSizeBytes(1000 + index);

  if (!id.ok || !sizeBytes.ok) throw new Error('Invalid fixture.');

  return {
    id: id.value,
    sourceName: `Artist ${index} - Track ${index}.flac`,
    sizeBytes: sizeBytes.value,
    extension: 'flac',
    importedAt: iso('2026-06-26T00:00:00.000Z'),
  };
}

function fixtureJobAt(asset: AudioAsset, index: number) {
  const id = createConversionJobId(`job-${index}`);
  const presetId = createPresetId('cdj_rekordbox_safe_aiff');

  if (!id.ok || !presetId.ok) throw new Error('Invalid fixture.');

  const job = createConversionJob({
    id: id.value,
    assetId: asset.id,
    presetId: presetId.value,
    outputName: `Artist ${index} - Track ${index}.aiff`,
  });

  if (!job.ok) throw new Error('Invalid fixture.');
  return { ...job.value, status: 'completed' as const };
}

describe('buildConversionReport', () => {
  it('summarizes queue jobs and includes local audit fields', () => {
    const asset = fixtureAsset();
    const queueId = createQueueId('queue-1');
    if (!queueId.ok) throw new Error('Invalid fixture.');

    const queue = createQueue({
      id: queueId.value,
      jobs: [fixtureJob(asset)],
      createdAt: iso('2026-06-26T00:00:01.000Z'),
    });
    const preset = getDefaultPreset();
    const report = buildConversionReport({
      queue,
      assets: [asset],
      preset,
      destination: { type: 'directory', name: 'prepared aiff' },
      generatedAt: iso('2026-06-26T00:00:02.000Z'),
    });

    expect(report.schemaVersion).toBe(1);
    expect(report.preset.name).toBe('cdj / rekordbox safe aiff');
    expect(report.destination.name).toBe('prepared aiff');
    expect(report.summary).toMatchObject({ total: 1, completed: 1, failed: 0 });
    expect(report.metadataSummary).toEqual({ complete: 0, partial: 0, missing: 0 });
    expect(report.jobs[0]).toMatchObject({ sourceName: 'Track.flac', outputName: 'Track.aiff' });
  });

  it('builds reports for 1,000 jobs without repeated asset scans', () => {
    const queueId = createQueueId('large-report-queue');
    if (!queueId.ok) throw new Error('Invalid fixture.');
    const assets = Array.from({ length: performanceBudgets.minimumUsableQueueSize }, (_, index) =>
      fixtureAssetAt(index + 1),
    );
    const queue = createQueue({
      id: queueId.value,
      jobs: assets.map((asset, index) => fixtureJobAt(asset, index + 1)),
      createdAt: iso('2026-06-26T00:00:01.000Z'),
    });

    const report = buildConversionReport({
      queue,
      assets,
      preset: getDefaultPreset(),
      destination: { type: 'download_fallback', name: 'Browser downloads' },
      generatedAt: iso('2026-06-26T00:00:02.000Z'),
    });

    expect(report.summary.completed).toBe(performanceBudgets.minimumUsableQueueSize);
    expect(report.jobs).toHaveLength(performanceBudgets.minimumUsableQueueSize);
    expect(report.jobs[999]?.sourceName).toBe('Artist 1000 - Track 1000.flac');
  });
});
