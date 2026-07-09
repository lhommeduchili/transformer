import { describe, expect, it } from 'vitest';

import { cdjSafeFilenamePolicy } from '../domain/filename-policy';
import { sanitizeFilenameBase } from '../domain/filename-sanitizer';

describe('sanitizeFilenameBase', () => {
  it('removes path-hostile characters and preserves useful text', () => {
    const sanitized = sanitizeFilenameBase(
      '  Artist / Track: Live?.flac',
      cdjSafeFilenamePolicy,
      'track-1',
    );

    expect(sanitized.baseName).toBe('Artist - Track- Live');
    expect(sanitized.changed).toBe(true);
  });

  it('preserves artist-title spacing around safe separators', () => {
    const sanitized = sanitizeFilenameBase(
      'Cirrus - Boomerang.flac',
      cdjSafeFilenamePolicy,
      'track-1',
    );

    expect(sanitized.baseName).toBe('Cirrus - Boomerang');
    expect(sanitized.changed).toBe(false);
  });

  it('falls back when ascii-only sanitization empties the name', () => {
    const sanitized = sanitizeFilenameBase('夏.flac', cdjSafeFilenamePolicy, 'track-1');

    expect(sanitized.baseName).toBe('track-1');
  });
});
