import type {
  OutputDestinationSelection,
  OutputFile,
  OutputWriteResult,
} from '../application/output-destination';
import type { OutputWriterPort } from '../application/output-writer-port';

export function createBrowserDownloadOutputWriter(): OutputWriterPort {
  const destination = { type: 'download_fallback', name: 'Browser downloads' } as const;

  return {
    destination,
    chooseDestination: (): Promise<OutputDestinationSelection> => Promise.resolve({ destination }),
    writeFile: (file: OutputFile): Promise<OutputWriteResult> => {
      const url = URL.createObjectURL(
        new Blob([arrayBufferForBlob(file.data)], { type: file.mimeType }),
      );
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = file.name;
      anchor.rel = 'noreferrer';
      anchor.style.display = 'none';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      return Promise.resolve({ outputName: file.name, destination });
    },
  };
}

function arrayBufferForBlob(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}
