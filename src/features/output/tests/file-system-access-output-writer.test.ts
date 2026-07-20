import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFileSystemAccessOutputWriter } from '../infrastructure/file-system-access-output-writer';

describe('file system access output writer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('suffixes output names that already exist in the selected directory', async () => {
    const existingNames = new Set(['Track.aiff', 'Track-2.aiff']);
    const writtenNames: string[] = [];
    const close = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const write = vi.fn<(data: Blob) => Promise<void>>().mockResolvedValue(undefined);
    const directoryHandle = {
      name: 'DJ USB',
      getFileHandle: vi.fn((name: string, options?: { readonly create?: boolean }) => {
        if (!options?.create) {
          return existingNames.has(name)
            ? Promise.resolve({ createWritable: () => Promise.resolve({ write, close }) })
            : Promise.reject(new DOMException('File not found.', 'NotFoundError'));
        }

        existingNames.add(name);
        writtenNames.push(name);
        return Promise.resolve({ createWritable: () => Promise.resolve({ write, close }) });
      }),
    };

    vi.stubGlobal('window', {
      showDirectoryPicker: () => Promise.resolve(directoryHandle),
    });

    const writer = createFileSystemAccessOutputWriter();
    await writer.chooseDestination();
    const result = await writer.writeFile({
      name: 'Track.aiff',
      data: new Uint8Array([1, 2, 3]),
      mimeType: 'audio/aiff',
    });

    expect(result.outputName).toBe('Track-3.aiff');
    expect(writtenNames).toEqual(['Track-3.aiff']);
    expect(write).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it('propagates directory lookup errors instead of risking an overwrite', async () => {
    const directoryHandle = {
      name: 'DJ USB',
      getFileHandle: vi.fn(() => Promise.reject(new Error('Permission expired.'))),
    };

    vi.stubGlobal('window', {
      showDirectoryPicker: () => Promise.resolve(directoryHandle),
    });

    const writer = createFileSystemAccessOutputWriter();
    await writer.chooseDestination();

    await expect(
      writer.writeFile({
        name: 'Track.aiff',
        data: new Uint8Array([1, 2, 3]),
        mimeType: 'audio/aiff',
      }),
    ).rejects.toThrow('Permission expired.');
  });

  it('finishes a write against the directory selected when the write began', async () => {
    let resolveLookup!: () => void;
    const lookupPending = new Promise<void>((resolve) => {
      resolveLookup = resolve;
    });
    const firstWrites: string[] = [];
    const secondWrites: string[] = [];
    const firstDirectory = directory('first', firstWrites, lookupPending);
    const secondDirectory = directory('second', secondWrites);
    const selectedDirectories = [firstDirectory, secondDirectory];
    vi.stubGlobal('window', {
      showDirectoryPicker: () => Promise.resolve(selectedDirectories.shift()!),
    });
    const writer = createFileSystemAccessOutputWriter();
    await writer.chooseDestination();

    const pendingWrite = writer.writeFile({
      name: 'Track.aiff',
      data: new Uint8Array([1]),
      mimeType: 'audio/aiff',
    });
    await Promise.resolve();
    await writer.chooseDestination();
    resolveLookup();

    await expect(pendingWrite).resolves.toMatchObject({
      outputName: 'Track.aiff',
      destination: { name: 'first' },
    });
    expect(firstWrites).toEqual(['Track.aiff']);
    expect(secondWrites).toEqual([]);
  });
});

function directory(name: string, writes: string[], lookupPending?: Promise<void>) {
  return {
    name,
    getFileHandle: async (fileName: string, options?: { readonly create?: boolean }) => {
      if (!options?.create) {
        await lookupPending;
        throw new DOMException('File not found.', 'NotFoundError');
      }

      writes.push(fileName);
      return {
        createWritable: () =>
          Promise.resolve({
            write: () => Promise.resolve(),
            close: () => Promise.resolve(),
          }),
      };
    },
  };
}
