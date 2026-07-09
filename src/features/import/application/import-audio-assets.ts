import type { ClockPort } from '../../../shared/application/clock-port';
import type { IdGeneratorPort } from '../../../shared/application/id-generator-port';
import type { AudioAssetId } from '../../../shared/domain/ids';
import { createAudioAsset, type AudioAsset } from '../domain/audio-asset';
import type { InputFileReference } from './input-file-reference';
import { extensionFromName, isSupportedAudioExtension } from './supported-audio-types';

export type ImportRejection = {
  readonly name: string;
  readonly reason: 'unsupported_extension' | 'invalid_asset';
  readonly extension: string;
};

export type ImportAudioAssetsResult = {
  readonly assets: readonly AudioAsset[];
  readonly rejected: readonly ImportRejection[];
};

export type ImportAudioAssetsDependencies = {
  readonly idGenerator: IdGeneratorPort<AudioAssetId>;
  readonly clock: ClockPort;
};

export function importAudioAssets(
  files: readonly InputFileReference[],
  dependencies: ImportAudioAssetsDependencies,
): ImportAudioAssetsResult {
  const assets: AudioAsset[] = [];
  const rejected: ImportRejection[] = [];

  for (const file of files) {
    const extension = file.extension || extensionFromName(file.name);

    if (!isSupportedAudioExtension(extension)) {
      rejected.push({ name: file.name, reason: 'unsupported_extension', extension });
      continue;
    }

    const assetInput = {
      id: dependencies.idGenerator.nextId(),
      sourceName: file.name,
      sizeBytes: file.sizeBytes,
      extension,
      importedAt: dependencies.clock.now(),
      ...(file.path === undefined ? {} : { sourcePath: file.path }),
      ...(file.mimeType === undefined ? {} : { mimeType: file.mimeType }),
    };

    const asset = createAudioAsset(assetInput);

    if (asset.ok) {
      assets.push(asset.value);
    } else {
      rejected.push({ name: file.name, reason: 'invalid_asset', extension });
    }
  }

  return { assets, rejected };
}
