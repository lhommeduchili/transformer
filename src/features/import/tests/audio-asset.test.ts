import { describe, expect, it } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import { createAudioAssetId } from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import { createAudioAsset } from '../domain/audio-asset';

function validAssetInput() {
  const id = createAudioAssetId('asset-1');
  const sizeBytes = createFileSizeBytes(1024);
  const importedAt = createDateTimeIso('2026-06-24T00:00:00.000Z');

  if (!id.ok || !sizeBytes.ok || !importedAt.ok) throw new Error('Invalid fixture.');

  return {
    id: id.value,
    sourceName: ' Track.WAV ',
    sizeBytes: sizeBytes.value,
    extension: '.WAV',
    importedAt: importedAt.value,
  };
}

describe('createAudioAsset', () => {
  it('normalizes names and extensions', () => {
    const asset = createAudioAsset(validAssetInput());

    expect(asset.ok).toBe(true);
    if (!asset.ok) throw new Error('Expected valid asset.');
    expect(asset.value.sourceName).toBe('Track.WAV');
    expect(asset.value.extension).toBe('wav');
  });

  it('rejects empty source names', () => {
    const asset = createAudioAsset({ ...validAssetInput(), sourceName: ' ' });

    expect(asset).toEqual({ ok: false, error: { type: 'empty_source_name' } });
  });
});
