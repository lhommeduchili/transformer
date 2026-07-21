import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DesktopOutputApi } from '../application/desktop-output-api';
import { createDesktopOutputWriter } from '../infrastructure/desktop-output-writer';

describe('desktop output writer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('selects a desktop directory and writes through the narrow bridge', async () => {
    const writeFile = vi.fn<DesktopOutputApi['writeFile']>().mockResolvedValue({
      outputName: 'Track-2.aiff',
    });
    vi.stubGlobal('window', {
      transformerDesktop: {
        chooseDirectory: () =>
          Promise.resolve({ status: 'selected', token: 'opaque-token', displayName: 'DJ USB' }),
        writeFile,
      } satisfies DesktopOutputApi,
    });

    const writer = createDesktopOutputWriter();
    await expect(writer.chooseDestination()).resolves.toEqual({
      destination: { type: 'directory', name: 'DJ USB' },
    });
    await expect(
      writer.writeFile({
        name: 'Track.aiff',
        data: new Uint8Array([1, 2, 3]),
        mimeType: 'audio/aiff',
      }),
    ).resolves.toEqual({
      outputName: 'Track-2.aiff',
      destination: { type: 'directory', name: 'DJ USB' },
    });
    const request = writeFile.mock.calls[0]?.[0];
    expect(request?.token).toBe('opaque-token');
    expect(request?.fileName).toBe('Track.aiff');
    expect(request?.data).toBeInstanceOf(ArrayBuffer);
  });

  it('does not replace the active destination when selection is cancelled', async () => {
    const selections = [
      { status: 'selected', token: 'opaque-token', displayName: 'DJ USB' } as const,
      { status: 'cancelled' } as const,
    ];
    vi.stubGlobal('window', {
      transformerDesktop: {
        chooseDirectory: () => Promise.resolve(selections.shift()!),
        writeFile: () => Promise.resolve({ outputName: 'Track.aiff' }),
      } satisfies DesktopOutputApi,
    });

    const writer = createDesktopOutputWriter();
    await writer.chooseDestination();
    await expect(writer.chooseDestination()).resolves.toEqual({
      destination: { type: 'directory', name: 'DJ USB' },
    });
    expect(writer.destination).toEqual({ type: 'directory', name: 'DJ USB' });
  });
});
