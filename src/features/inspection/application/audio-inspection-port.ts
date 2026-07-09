import type { AudioAsset } from '../../import/domain/audio-asset';
import type { TrackInspection } from '../domain/track-inspection';

export type AudioInspectionPort = {
  readonly inspect: (assets: readonly AudioAsset[]) => Promise<readonly TrackInspection[]>;
};
