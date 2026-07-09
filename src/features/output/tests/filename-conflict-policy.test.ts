import { describe, expect, it } from 'vitest';

import { nextAvailableFilename } from '../application/filename-conflict-policy';

describe('nextAvailableFilename', () => {
  it('adds a suffix when the requested filename exists', () => {
    const existing = new Set(['Track.aiff', 'Track-2.aiff']);

    expect(nextAvailableFilename('Track.aiff', (candidate) => existing.has(candidate))).toBe(
      'Track-3.aiff',
    );
  });
});
