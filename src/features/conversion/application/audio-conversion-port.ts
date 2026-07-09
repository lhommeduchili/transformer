import type { AudioConversionCommand, AudioConversionResult } from './conversion-command';
import type { AudioConversionProgressEvent } from './conversion-progress-events';

export type AudioConversionPort = {
  readonly convert: (
    command: AudioConversionCommand,
    input: Uint8Array,
    onProgress: (event: AudioConversionProgressEvent) => void,
  ) => Promise<AudioConversionResult>;
  readonly cancel: () => void;
  readonly dispose: () => void;
};
