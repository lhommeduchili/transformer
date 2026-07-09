import type { AudioAsset } from '../../import/domain/audio-asset';
import type { TrackInspection } from '../domain/track-inspection';
import type { AudioInspectionPort } from './audio-inspection-port';

export async function inspectAudioAssets(
  assets: readonly AudioAsset[],
  inspectionPort: AudioInspectionPort,
): Promise<readonly TrackInspection[]> {
  return inspectionPort.inspect(assets);
}
