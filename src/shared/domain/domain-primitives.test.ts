import { describe, expect, it } from 'vitest';

import { createDateTimeIso } from './date-time';
import { createAudioAssetId } from './ids';
import { createProgressPercent } from './numbers';

describe('domain primitives', () => {
  it('accepts non-empty identifiers', () => {
    const id = createAudioAssetId(' asset-1 ');

    expect(id.ok).toBe(true);
    if (!id.ok) throw new Error('Expected id to be valid.');
    expect(id.value).toBe('asset-1');
  });

  it('rejects empty identifiers', () => {
    const id = createAudioAssetId('   ');

    expect(id).toEqual({ ok: false, error: { type: 'invalid_id', value: '   ' } });
  });

  it('constrains progress to 0 through 100', () => {
    expect(createProgressPercent(50).ok).toBe(true);
    expect(createProgressPercent(101).ok).toBe(false);
  });

  it('requires canonical ISO date-time strings', () => {
    expect(createDateTimeIso('2026-06-24T00:00:00.000Z').ok).toBe(true);
    expect(createDateTimeIso('2026-06-24').ok).toBe(false);
  });
});
