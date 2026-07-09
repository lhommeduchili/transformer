import { describe, expect, it } from 'vitest';

import type { ClockPort } from '../../../shared/application/clock-port';
import { createDateTimeIso } from '../../../shared/domain/date-time';
import { createProgressPercent } from '../../../shared/domain/numbers';
import {
  createAudioAssetId,
  createConversionJobId,
  createQueueId,
} from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import type { AudioConversionPort } from '../../conversion/application/audio-conversion-port';
import type { AudioAsset } from '../../import/domain/audio-asset';
import { getDefaultPreset } from '../../presets/domain/built-in-presets';
import { previewOutputFilenames } from '../../presets/domain/output-filename-preview';
import { planConversionQueue } from '../application/plan-conversion-queue';
import { startQueue } from '../domain/conversion-queue';
import { createConversionQueueExecutor } from '../infrastructure/conversion-queue-executor';

function clock(): ClockPort {
  const now = createDateTimeIso('2026-06-24T00:00:00.000Z');
  if (!now.ok) throw new Error('Invalid fixture.');
  return { now: () => now.value };
}

function asset(): AudioAsset {
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

function plannedQueue() {
  const queueId = createQueueId('queue-1');
  const jobId = createConversionJobId('job-1');
  if (!queueId.ok || !jobId.ok) throw new Error('Invalid fixture.');

  const preset = getDefaultPreset();
  const previews = previewOutputFilenames([asset()], preset);
  const planned = planConversionQueue(previews, preset, {
    queueIdGenerator: { nextId: () => queueId.value },
    jobIdGenerator: { nextId: () => jobId.value },
    clock: clock(),
  });

  if (!planned.ok) throw new Error('Invalid fixture.');
  const running = startQueue(planned.value, clock().now());
  if (!running.ok) throw new Error('Invalid fixture.');

  return { queue: running.value, preset, sourceAsset: asset() };
}

describe('conversion queue executor', () => {
  it('updates progress and completes with a mocked conversion port', async () => {
    const progress = createProgressPercent(50);
    if (!progress.ok) throw new Error('Invalid fixture.');

    const converter: AudioConversionPort = {
      convert: (command, _input, onProgress) => {
        onProgress({ assetId: command.assetId, percent: progress.value });
        return Promise.resolve({
          assetId: command.assetId,
          outputName: command.outputName,
          data: new Uint8Array([1]),
          mimeType: 'audio/aiff',
        });
      },
      cancel: () => undefined,
      dispose: () => undefined,
    };
    const { queue, preset, sourceAsset } = plannedQueue();

    const completed = await new Promise<string>((resolve, reject) => {
      createConversionQueueExecutor(converter, clock(), {
        preset,
        inputByAssetId: new Map([[sourceAsset.id, new Uint8Array([1])]]),
      }).execute(queue, {
        onSnapshot: () => undefined,
        onComplete: (snapshot) => resolve(snapshot.queue.status),
        onError: reject,
      });
    });

    expect(completed).toBe('completed');
  });
});
