import { describe, expect, it } from 'vitest';

import { builtInPresets, getDefaultPreset } from '../domain/built-in-presets';

describe('built-in presets', () => {
  it('defaults to cdj/rekordbox-safe aiff', () => {
    const preset = getDefaultPreset();

    expect(preset.name).toBe('cdj / rekordbox safe aiff');
    expect(preset.targetContainer).toBe('aiff');
    expect(preset.targetCodec).toBe('pcm_s16be');
    expect(preset.sampleRateHz).toBe(44100);
    expect(preset.channels).toBe('stereo');
  });

  it('keeps mp3 320 as a secondary dj-safe preset', () => {
    expect(builtInPresets.some((preset) => preset.name.includes('mp3 320'))).toBe(true);
  });

  it('preserves source metadata in every built-in preset', () => {
    expect(builtInPresets.every((preset) => preset.metadataPolicy.mode === 'preserve')).toBe(true);
  });
});
