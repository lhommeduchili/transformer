import { describe, expect, it } from 'vitest';

import { createPresetId } from '../../../shared/domain/ids';
import { createBrowserPreferencesAdapter } from '../infrastructure/browser-preferences-adapter';

describe('browser preferences adapter', () => {
  it('persists the selected preset locally', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } as unknown as Storage;
    const presetId = createPresetId('wav_archival_44100');
    if (!presetId.ok) throw new Error('Invalid fixture.');
    const adapter = createBrowserPreferencesAdapter(storage);

    adapter.save({ presetId: presetId.value });

    expect(adapter.load()).toEqual({ presetId: presetId.value });
  });

  it('ignores malformed persisted data', () => {
    const storage = {
      getItem: () => '{bad json',
      setItem: () => undefined,
    } as unknown as Storage;

    expect(createBrowserPreferencesAdapter(storage).load()).toEqual({});
  });
});
