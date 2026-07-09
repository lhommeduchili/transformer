import type { AudioAsset } from '../../import/domain/audio-asset';
import type { ConversionPreset } from './conversion-preset';
import { sanitizeFilenameBase } from './filename-sanitizer';

export type OutputFilenamePreview = {
  readonly asset: AudioAsset;
  readonly outputName: string;
  readonly changed: boolean;
};

export function previewOutputFilenames(
  assets: readonly AudioAsset[],
  preset: ConversionPreset,
): readonly OutputFilenamePreview[] {
  const counts = new Map<string, number>();

  return assets.map((asset, index) => {
    const sanitized = sanitizeFilenameBase(
      asset.sourceName,
      preset.filenamePolicy,
      `track-${index + 1}`,
    );
    const extension = preset.targetContainer === 'aiff' ? 'aiff' : preset.targetContainer;
    const baseCount = counts.get(sanitized.baseName) ?? 0;
    counts.set(sanitized.baseName, baseCount + 1);

    const uniqueBase =
      baseCount === 0 ? sanitized.baseName : `${sanitized.baseName}-${baseCount + 1}`;
    const outputName = `${uniqueBase}.${extension}`;

    return {
      asset,
      outputName,
      changed: sanitized.changed || outputName !== asset.sourceName,
    };
  });
}
