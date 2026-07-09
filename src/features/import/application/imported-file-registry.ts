import type { AudioAssetId } from '../../../shared/domain/ids';

export type ImportedFileRegistry = {
  readonly register: (assetId: AudioAssetId, file: File) => void;
  readonly get: (assetId: AudioAssetId) => File | undefined;
  readonly unregister: (assetId: AudioAssetId) => void;
  readonly clear: () => void;
};

export function createImportedFileRegistry(): ImportedFileRegistry {
  const files = new Map<AudioAssetId, File>();

  return {
    register: (assetId, file) => files.set(assetId, file),
    get: (assetId) => files.get(assetId),
    unregister: (assetId) => {
      files.delete(assetId);
    },
    clear: () => files.clear(),
  };
}
