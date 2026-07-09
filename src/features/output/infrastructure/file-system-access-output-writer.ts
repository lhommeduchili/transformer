import { nextAvailableFilename } from '../application/filename-conflict-policy';
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
  const writtenNames = new Set<string>();

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
      writtenNames.clear();

      return { destination: { type: 'directory', name: directoryHandle.name } };
    },
    writeFile: async (file: OutputFile): Promise<OutputWriteResult> => {
      if (directoryHandle === undefined) {
        throw new Error('Choose an output folder before writing files.');
      }

      const outputName = nextAvailableFilename(file.name, (candidate) =>
        writtenNames.has(candidate),
      );
      const fileHandle = await directoryHandle.getFileHandle(outputName, { create: true });
      const writable = await fileHandle.createWritable();

      await writable.write(new Blob([arrayBufferForBlob(file.data)], { type: file.mimeType }));
      await writable.close();
      writtenNames.add(outputName);

      return { outputName, destination: { type: 'directory', name: directoryHandle.name } };
    },
  };
}

function arrayBufferForBlob(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}
