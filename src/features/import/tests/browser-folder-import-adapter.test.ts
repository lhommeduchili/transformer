import { describe, expect, it } from 'vitest';

import { filesFromDataTransfer } from '../infrastructure/browser-folder-import-adapter';

type TestEntry =
  | {
      readonly isFile: true;
      readonly isDirectory: false;
      readonly file: (success: (file: File) => void) => void;
    }
  | {
      readonly isFile: false;
      readonly isDirectory: true;
      readonly createReader: () => {
        readonly readEntries: (success: (entries: readonly TestEntry[]) => void) => void;
      };
    };

function fileEntry(file: File): TestEntry {
  return { isFile: true, isDirectory: false, file: (success) => success(file) };
}

function directoryEntry(...entries: readonly TestEntry[]): TestEntry {
  return {
    isFile: false,
    isDirectory: true,
    createReader: () => {
      let read = false;
      return {
        readEntries: (success) => {
          success(read ? [] : entries);
          read = true;
        },
      };
    },
  };
}

describe('browser folder import adapter', () => {
  it('recursively resolves dropped directory entries', async () => {
    const first = new File(['one'], 'one.flac');
    const second = new File(['two'], 'two.wav');
    const root = directoryEntry(fileEntry(first), directoryEntry(fileEntry(second)));
    const dataTransfer = {
      items: [{ kind: 'file', webkitGetAsEntry: () => root }],
      files: [],
    } as unknown as DataTransfer;

    await expect(filesFromDataTransfer(dataTransfer)).resolves.toEqual([first, second]);
  });

  it('falls back to the flat file list when entry APIs are unavailable', async () => {
    const file = new File(['one'], 'one.flac');
    const dataTransfer = {
      items: [{ kind: 'file' }],
      files: [file],
    } as unknown as DataTransfer;

    await expect(filesFromDataTransfer(dataTransfer)).resolves.toEqual([file]);
  });

  it('keeps readable files when another dropped entry fails', async () => {
    const file = new File(['one'], 'one.flac');
    const failedEntry: TestEntry = {
      isFile: true,
      isDirectory: false,
      file: () => {
        throw new DOMException('Permission denied.', 'NotAllowedError');
      },
    };
    const dataTransfer = {
      items: [
        { kind: 'file', webkitGetAsEntry: () => failedEntry },
        { kind: 'file', webkitGetAsEntry: () => fileEntry(file) },
      ],
      files: [],
    } as unknown as DataTransfer;

    await expect(filesFromDataTransfer(dataTransfer)).resolves.toEqual([file]);
  });
});
