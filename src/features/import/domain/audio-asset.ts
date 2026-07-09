import type { DateTimeIso } from '../../../shared/domain/date-time';
import type { AudioAssetId } from '../../../shared/domain/ids';
import type { FileSizeBytes } from '../../../shared/domain/numbers';
import { err, ok, type Result } from '../../../shared/domain/result';

export type AudioAsset = {
  readonly id: AudioAssetId;
  readonly sourceName: string;
  readonly sourcePath?: string;
  readonly sizeBytes: FileSizeBytes;
  readonly mimeType?: string;
  readonly extension: string;
  readonly importedAt: DateTimeIso;
};

export type AudioAssetError =
  | { readonly type: 'empty_source_name' }
  | { readonly type: 'empty_extension'; readonly sourceName: string };

export function createAudioAsset(input: AudioAsset): Result<AudioAsset, AudioAssetError> {
  if (input.sourceName.trim().length === 0) {
    return err({ type: 'empty_source_name' });
  }

  if (input.extension.trim().length === 0) {
    return err({ type: 'empty_extension', sourceName: input.sourceName });
  }

  const normalized: AudioAsset = {
    ...input,
    sourceName: input.sourceName.trim(),
    extension: input.extension.trim().toLowerCase().replace(/^\./, ''),
  };

  return ok(normalized);
}
