import type { AudioAssetId } from '../../../shared/domain/ids';
import type { ConversionPreset } from '../../presets/domain/conversion-preset';

export type AudioConversionCommand = {
  readonly assetId: AudioAssetId;
  readonly inputName: string;
  readonly outputName: string;
  readonly preset: ConversionPreset;
};

export type AudioConversionResult = {
  readonly assetId: AudioAssetId;
  readonly outputName: string;
  readonly data: Uint8Array;
  readonly mimeType: string;
};
