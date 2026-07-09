import { describe, expect, it } from 'vitest';

import { extensionFromName, isSupportedAudioExtension } from '../application/supported-audio-types';

describe('supported audio types', () => {
  it('extracts lowercase extensions from filenames', () => {
    expect(extensionFromName('Track.WAV')).toBe('wav');
  });

  it('detects DJ-relevant supported audio extensions', () => {
    expect(isSupportedAudioExtension('mp3')).toBe(true);
    expect(isSupportedAudioExtension('aiff')).toBe(true);
    expect(isSupportedAudioExtension('txt')).toBe(false);
  });
});
