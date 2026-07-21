import type { OutputWriterPort } from '../application/output-writer-port';

export function supportsDesktopOutput(): boolean {
  return window.transformerDesktop !== undefined;
}

export function createDesktopOutputWriter(): OutputWriterPort {
  const api = window.transformerDesktop;
  let selectedDirectory: { readonly token: string; readonly displayName: string } | undefined;

  if (api === undefined) {
    throw new Error('Desktop output is not available.');
  }

  return {
    get destination() {
      return selectedDirectory === undefined
        ? ({ type: 'directory', name: 'No folder selected' } as const)
        : ({ type: 'directory', name: selectedDirectory.displayName } as const);
    },
    chooseDestination: async () => {
      const selection = await api.chooseDirectory();

      if (selection.status === 'cancelled') {
        return {
          destination:
            selectedDirectory === undefined
              ? ({ type: 'directory', name: 'No folder selected' } as const)
              : ({ type: 'directory', name: selectedDirectory.displayName } as const),
        };
      }

      selectedDirectory = selection;
      return { destination: { type: 'directory', name: selection.displayName } };
    },
    writeFile: async (file) => {
      const directory = selectedDirectory;
      if (directory === undefined) {
        throw new Error('Choose an output folder before writing files.');
      }

      const result = await api.writeFile({
        token: directory.token,
        fileName: file.name,
        data: arrayBufferForDesktop(file.data),
      });

      return {
        outputName: result.outputName,
        destination: { type: 'directory', name: directory.displayName },
      };
    },
  };
}

function arrayBufferForDesktop(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}
