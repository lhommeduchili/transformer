import type { AudioAssetId } from '../../../shared/domain/ids';
import type { TrackInspection } from '../domain/track-inspection';

export type AudioHeaderInspectionInput = {
  readonly assetId: AudioAssetId;
  readonly extension: string;
  readonly header: Uint8Array;
};

export type AudioHeaderInspectorPort = {
  readonly inspectHeader: (input: AudioHeaderInspectionInput) => Promise<TrackInspection>;
  readonly dispose: () => void;
};
