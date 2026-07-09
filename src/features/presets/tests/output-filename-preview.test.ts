import { describe, expect, it } from 'vitest';

import { createDateTimeIso } from '../../../shared/domain/date-time';
import { createAudioAssetId } from '../../../shared/domain/ids';
import { createFileSizeBytes } from '../../../shared/domain/numbers';
import type { AudioAsset } from '../../import/domain/audio-asset';
import { getDefaultPreset } from '../domain/built-in-presets';
import { previewOutputFilenames } from '../domain/output-filename-preview';

function asset(idValue: string, sourceName: string): AudioAsset {
  const id = createAudioAssetId(idValue);
  const sizeBytes = createFileSizeBytes(1000);
  const importedAt = createDateTimeIso('2026-06-24T00:00:00.000Z');

  if (!id.ok || !sizeBytes.ok || !importedAt.ok) throw new Error('Invalid fixture.');

  return {
    id: id.value,
    sourceName,
    sizeBytes: sizeBytes.value,
    extension: 'flac',
    importedAt: importedAt.value,
  };
}

describe('previewOutputFilenames', () => {
  it('retargets imported files to AIFF extension by default', () => {
    const [preview] = previewOutputFilenames([asset('asset-1', 'Track.flac')], getDefaultPreset());

    expect(preview?.outputName).toBe('Track.aiff');
  });

  it('resolves duplicate sanitized output names', () => {
    const previews = previewOutputFilenames(
      [asset('asset-1', 'Track?.flac'), asset('asset-2', 'Track*.flac')],
      getDefaultPreset(),
    );

    expect(previews.map((preview) => preview.outputName)).toEqual(['Track.aiff', 'Track-2.aiff']);
  });
});
