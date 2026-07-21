import { describe, expect, it } from 'vitest';

import { nextOutputCandidate, parseDesktopWriteRequest, resolvePackagedAsset } from './security';

describe('desktop security boundaries', () => {
  it('resolves only assets contained by the packaged web root', () => {
    expect(resolvePackagedAsset('/application/dist', '/assets/app.js')).toBe(
      '/application/dist/assets/app.js',
    );
    expect(resolvePackagedAsset('/application/dist', '/../../private.txt')).toBeUndefined();
    expect(resolvePackagedAsset('/application/dist', '/%2e%2e/private.txt')).toBeUndefined();
  });

  it('accepts only opaque tokens, safe filenames, and array buffers', () => {
    expect(
      parseDesktopWriteRequest({
        token: 'opaque-token',
        fileName: 'Artist - Track.aiff',
        data: new Uint8Array([1, 2]).buffer,
      }),
    ).toMatchObject({ token: 'opaque-token', fileName: 'Artist - Track.aiff' });

    for (const fileName of ['../secret', '/tmp/secret', 'nested/secret', 'nested\\secret', '']) {
      expect(() =>
        parseDesktopWriteRequest({ token: 'opaque-token', fileName, data: new ArrayBuffer(1) }),
      ).toThrow('Invalid output request.');
    }
  });

  it('adds conflict suffixes before the file extension', () => {
    expect(nextOutputCandidate('Track.aiff', 2)).toBe('Track-2.aiff');
    expect(nextOutputCandidate('Track', 3)).toBe('Track-3');
  });
});
