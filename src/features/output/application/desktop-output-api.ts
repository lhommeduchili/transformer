export const desktopOutputChannels = {
  chooseDirectory: 'desktop-output:choose-directory',
  writeFile: 'desktop-output:write-file',
} as const;

export type DesktopDirectorySelection =
  | {
      readonly status: 'selected';
      readonly token: string;
      readonly displayName: string;
    }
  | { readonly status: 'cancelled' };

export type DesktopOutputApi = {
  readonly chooseDirectory: () => Promise<DesktopDirectorySelection>;
  readonly writeFile: (request: {
    readonly token: string;
    readonly fileName: string;
    readonly data: ArrayBuffer;
  }) => Promise<{ readonly outputName: string }>;
};
