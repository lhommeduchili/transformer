import type { AudioAssetId } from '../../../shared/domain/ids';
import type { ProgressPercent } from '../../../shared/domain/numbers';

export type AudioConversionProgressEvent = {
  readonly assetId: AudioAssetId;
  readonly percent: ProgressPercent;
  readonly ratio?: number;
  readonly time?: number;
};
