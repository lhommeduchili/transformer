import type {
  OutputDestinationSelection,
  OutputFile,
  OutputWriteResult,
} from '../application/output-destination';
import type { OutputWriterPort } from '../application/output-writer-port';

type FileSystemAccessWindow = Window & {
  readonly showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
};

type FileSystemDirectoryHandle = {
  readonly name: string;
  readonly getFileHandle: (
    name: string,
    options?: { readonly create?: boolean },
  ) => Promise<FileSystemFileHandle>;
};

type FileSystemFileHandle = {
  readonly createWritable: () => Promise<FileSystemWritableFileStream>;
};

type FileSystemWritableFileStream = {
  readonly write: (data: Blob) => Promise<void>;
  readonly close: () => Promise<void>;
};

export function supportsFileSystemAccess(): boolean {
  return typeof (window as FileSystemAccessWindow).showDirectoryPicker === 'function';
}

export function createFileSystemAccessOutputWriter(): OutputWriterPort {
  let directoryHandle: FileSystemDirectoryHandle | undefined;
  const writtenNamesByDirectory = new WeakMap<FileSystemDirectoryHandle, Set<string>>();

  return {
    get destination() {
      return directoryHandle === undefined
        ? ({ type: 'directory', name: 'No folder selected' } as const)
        : ({ type: 'directory', name: directoryHandle.name } as const);
    },
    chooseDestination: async (): Promise<OutputDestinationSelection> => {
      const picker = (window as FileSystemAccessWindow).showDirectoryPicker;

      if (picker === undefined) {
        throw new Error('Output folder selection is not supported by this browser.');
      }

      directoryHandle = await picker();
      writtenNamesByDirectory.set(directoryHandle, new Set());

      return { destination: { type: 'directory', name: directoryHandle.name } };
    },
    writeFile: async (file: OutputFile): Promise<OutputWriteResult> => {
      const targetDirectory = directoryHandle;
      if (targetDirectory === undefined) {
        throw new Error('Choose an output folder before writing files.');
      }

      const writtenNames = writtenNamesByDirectory.get(targetDirectory) ?? new Set<string>();
      writtenNamesByDirectory.set(targetDirectory, writtenNames);
      const outputName = await nextAvailableDirectoryFilename(
        targetDirectory,
        file.name,
        writtenNames,
      );
      const fileHandle = await targetDirectory.getFileHandle(outputName, { create: true });
      const writable = await fileHandle.createWritable();

      await writable.write(new Blob([arrayBufferForBlob(file.data)], { type: file.mimeType }));
      await writable.close();
      writtenNames.add(outputName);

      return { outputName, destination: { type: 'directory', name: targetDirectory.name } };
    },
  };
}

async function nextAvailableDirectoryFilename(
  directoryHandle: FileSystemDirectoryHandle,
  requestedName: string,
  writtenNames: ReadonlySet<string>,
): Promise<string> {
  const lastDot = requestedName.lastIndexOf('.');
  const baseName = lastDot > 0 ? requestedName.slice(0, lastDot) : requestedName;
  const extension = lastDot > 0 ? requestedName.slice(lastDot) : '';
  let candidate = requestedName;
  let index = 2;

  while (writtenNames.has(candidate) || (await directoryContains(directoryHandle, candidate))) {
    candidate = `${baseName}-${index}${extension}`;
    index += 1;
  }

  return candidate;
}

async function directoryContains(
  directoryHandle: FileSystemDirectoryHandle,
  name: string,
): Promise<boolean> {
  try {
    await directoryHandle.getFileHandle(name);
    return true;
  } catch (error) {
    if (isNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'NotFoundError'
  );
}

function arrayBufferForBlob(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}
