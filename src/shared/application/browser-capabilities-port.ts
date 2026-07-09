export type BrowserCapabilities = {
  readonly filePicker: boolean;
  readonly dragAndDrop: boolean;
  readonly folderDrop: boolean;
  readonly fileSystemAccess: boolean;
};

export type BrowserCapabilitiesPort = {
  readonly detect: () => BrowserCapabilities;
};
