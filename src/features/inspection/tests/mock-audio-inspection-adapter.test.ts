import { describe, expect, it } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import { createAudioAssetId } from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import type { AudioAsset } from '../../import/domain/audio-asset';
import { createMockAudioInspectionAdapter } from '../infrastructure/mock-audio-inspection-adapter';

function asset(extension: string): AudioAsset {
  const id = createAudioAssetId(`asset-${extension}`);
  const sizeBytes = createFileSizeBytes(1234);
  const importedAt = createDateTimeIso('2026-06-24T00:00:00.000Z');

  if (!id.ok || !sizeBytes.ok || !importedAt.ok) throw new Error('Invalid fixture.');

  return {
    id: id.value,
    sourceName: `track.${extension}`,
    sizeBytes: sizeBytes.value,
    extension,
    importedAt: importedAt.value,
  };
}

describe('mock audio inspection adapter', () => {
  it('marks mp3 as 320kbps dj-compatible mock source', async () => {
    const [inspection] = await createMockAudioInspectionAdapter().inspect([asset('mp3')]);

    expect(inspection?.container).toBe('mp3');
    expect(inspection?.codec).toBe('mp3');
    expect(inspection?.bitrateKbps).toBe(320);
    expect(inspection?.sampleRateHz).toBe(44100);
  });

  it('warns non-mp3 files to plan aiff output by default', async () => {
    const [inspection] = await createMockAudioInspectionAdapter().inspect([asset('wav')]);

    expect(inspection?.warnings.some((warning) => warning.message.includes('aiff'))).toBe(true);
  });
});
