export type OutputDestination =
  | {
      readonly type: 'directory';
      readonly name: string;
    }
  | {
      readonly type: 'download_fallback';
      readonly name: 'Browser downloads';
    };

export type OutputDestinationSelection = {
  readonly destination: OutputDestination;
};

export type OutputWriteResult = {
  readonly outputName: string;
  readonly destination: OutputDestination;
};

export type OutputFile = {
  readonly name: string;
  readonly data: Uint8Array;
  readonly mimeType: string;
};
