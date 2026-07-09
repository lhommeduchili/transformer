import { describe, expect, it } from 'vitest';

import { createAudioAssetId } from '../../../shared/domain/ids';
import { createImportedFileRegistry } from '../application/imported-file-registry';

describe('createImportedFileRegistry', () => {
  it('stores file references without reading bytes', () => {
    const id = createAudioAssetId('asset-1');
    if (!id.ok) throw new Error('Invalid fixture.');

    const file = new File(['data'], 'track.flac');
    const registry = createImportedFileRegistry();

    registry.register(id.value, file);

    expect(registry.get(id.value)).toBe(file);
  });

  it('removes file references by asset id', () => {
    const id = createAudioAssetId('asset-1');
    if (!id.ok) throw new Error('Invalid fixture.');

    const registry = createImportedFileRegistry();
    registry.register(id.value, new File(['data'], 'track.flac'));
    registry.unregister(id.value);

    expect(registry.get(id.value)).toBeUndefined();
  });
});
