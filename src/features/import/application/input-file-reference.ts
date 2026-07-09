import type { FileSizeBytes } from '../../../shared/domain/numbers';

export type InputFileReference = {
  readonly name: string;
  readonly path?: string;
  readonly sizeBytes: FileSizeBytes;
  readonly mimeType?: string;
  readonly extension: string;
  readonly original: unknown;
};
