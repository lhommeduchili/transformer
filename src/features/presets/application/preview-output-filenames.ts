import type { AudioAsset } from '../../import/domain/audio-asset';
import type { ConversionPreset } from '../domain/conversion-preset';
import { previewOutputFilenames } from '../domain/output-filename-preview';
import type { OutputFilenamePreview } from '../domain/output-filename-preview';

export function previewFilenamesForPreset(
  assets: readonly AudioAsset[],
  preset: ConversionPreset,
): readonly OutputFilenamePreview[] {
  return previewOutputFilenames(assets, preset);
}
