import type {
  BrowserCapabilities,
  BrowserCapabilitiesPort,
} from '../../application/browser-capabilities-port';

type FileSystemAccessWindow = Window & {
  readonly showDirectoryPicker?: unknown;
};

type DataTransferItemGlobal = typeof globalThis & {
  readonly DataTransferItem?: { readonly prototype: object };
};

export function createBrowserCapabilitiesAdapter(): BrowserCapabilitiesPort {
  return {
    detect: detectBrowserCapabilities,
  };
}

export function detectBrowserCapabilities(): BrowserCapabilities {
  const fileSystemWindow = window as FileSystemAccessWindow;
  const dataTransferGlobal = globalThis as DataTransferItemGlobal;

  return {
    filePicker: typeof HTMLInputElement !== 'undefined',
    dragAndDrop: typeof DataTransfer !== 'undefined',
    folderDrop:
      dataTransferGlobal.DataTransferItem === undefined
        ? false
        : 'webkitGetAsEntry' in dataTransferGlobal.DataTransferItem.prototype,
    fileSystemAccess: typeof fileSystemWindow.showDirectoryPicker === 'function',
  };
}
