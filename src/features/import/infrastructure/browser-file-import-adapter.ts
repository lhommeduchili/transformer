import { createFileSizeBytes } from '../../../shared/domain/numbers';
import type { InputFileReference } from '../application/input-file-reference';
import { extensionFromName } from '../application/supported-audio-types';

export type BrowserFileImportAdapter = {
  readonly fromFileList: (files: FileList | readonly File[]) => readonly InputFileReference[];
};

export function createBrowserFileImportAdapter(): BrowserFileImportAdapter {
  return {
    fromFileList: (files) => Array.from(files).map(fileToReference),
  };
}

function fileToReference(file: File): InputFileReference {
  const sizeBytes = createFileSizeBytes(file.size);

  if (!sizeBytes.ok) {
    throw new Error(`Invalid file size for ${file.name}.`);
  }

  return {
    name: file.name,
    sizeBytes: sizeBytes.value,
    extension: extensionFromName(file.name),
    original: file,
    ...(file.type ? { mimeType: file.type } : {}),
  };
}
