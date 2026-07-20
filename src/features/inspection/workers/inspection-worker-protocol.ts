import type { AudioAssetId } from '../../../shared/domain/ids';
import type { TrackInspection } from '../domain/track-inspection';

export type InspectionWorkerCommand =
  | {
      readonly type: 'InspectAudioHeader';
      readonly requestId: string;
      readonly assetId: AudioAssetId;
      readonly extension: string;
      readonly header: Uint8Array;
    }
  | { readonly type: 'Dispose' };

export type InspectionWorkerEvent =
  | {
      readonly type: 'InspectionCompleted';
      readonly requestId: string;
      readonly inspection: TrackInspection;
    }
  | { readonly type: 'InspectionFailed'; readonly requestId: string; readonly message: string }
  | { readonly type: 'WorkerFailed'; readonly message: string };
