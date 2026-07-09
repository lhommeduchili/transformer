import type {
  OutputDestination,
  OutputDestinationSelection,
  OutputFile,
  OutputWriteResult,
} from './output-destination';

export type OutputWriterPort = {
  readonly destination: OutputDestination;
  readonly chooseDestination: () => Promise<OutputDestinationSelection>;
  readonly writeFile: (file: OutputFile) => Promise<OutputWriteResult>;
};
