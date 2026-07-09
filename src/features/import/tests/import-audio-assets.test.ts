import { describe, expect, it } from 'vitest';

import type { ClockPort } from '../../../shared/application/clock-port';
import type { IdGeneratorPort } from '../../../shared/application/id-generator-port';
import { createDateTimeIso } from '../../../shared/domain/date-time';
import { createAudioAssetId, type AudioAssetId } from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import { performanceBudgets } from '../../../shared/domain/performance-budgets';
import { importAudioAssets } from '../application/import-audio-assets';
import type { InputFileReference } from '../application/input-file-reference';

function dependencies(): {
  readonly idGenerator: IdGeneratorPort<AudioAssetId>;
  readonly clock: ClockPort;
} {
  const id = createAudioAssetId('asset-1');
  const now = createDateTimeIso('2026-06-24T00:00:00.000Z');

  if (!id.ok || !now.ok) throw new Error('Invalid fixture.');

  return {
    idGenerator: { nextId: () => id.value },
    clock: { now: () => now.value },
  };
}

function file(name: string): InputFileReference {
  const sizeBytes = createFileSizeBytes(1234);
  if (!sizeBytes.ok) throw new Error('Invalid fixture.');

  return {
    name,
    sizeBytes: sizeBytes.value,
    extension: name.split('.').at(-1)?.toLowerCase() ?? '',
    original: {},
  };
}

describe('importAudioAssets', () => {
  it('imports supported audio and rejects unsupported files', () => {
    const result = importAudioAssets([file('track.mp3'), file('notes.txt')], dependencies());

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]?.sourceName).toBe('track.mp3');
    expect(result.rejected).toEqual([
      { name: 'notes.txt', reason: 'unsupported_extension', extension: 'txt' },
    ]);
  });

  it('imports a large batch using lightweight file references only', () => {
    let nextId = 0;
    const now = createDateTimeIso('2026-06-24T00:00:00.000Z');
    if (!now.ok) throw new Error('Invalid fixture.');
    const files = Array.from({ length: performanceBudgets.minimumUsableQueueSize }, (_, index) =>
      file(`Artist ${index + 1} - Track ${index + 1}.flac`),
    );

    const result = importAudioAssets(files, {
      idGenerator: {
        nextId: () => {
          nextId += 1;
          const id = createAudioAssetId(`asset-${nextId}`);
          if (!id.ok) throw new Error('Invalid fixture.');
          return id.value;
        },
      },
      clock: { now: () => now.value },
    });

    expect(result.assets).toHaveLength(performanceBudgets.minimumUsableQueueSize);
    expect(result.rejected).toHaveLength(0);
    expect(result.assets[999]?.sourceName).toBe('Artist 1000 - Track 1000.flac');
  });
});
