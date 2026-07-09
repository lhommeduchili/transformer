import type { AudioAssetId } from '../../../shared/domain/ids';
import type { BitrateKbps, DurationMs, SampleRateHz } from '../../../shared/domain/numbers';
import type { AudioCodec, AudioContainer } from '../../presets/domain/audio-format';
import type { CompatibilityWarning } from '../../presets/domain/compatibility-profile';

export type TrackMetadata = {
  readonly title?: string;
  readonly artist?: string;
  readonly album?: string;
  readonly year?: string;
  readonly genre?: string;
  readonly trackNumber?: string;
};

export type TrackInspection = {
  readonly assetId: AudioAssetId;
  readonly durationMs?: DurationMs;
  readonly bitrateKbps?: BitrateKbps;
  readonly sampleRateHz?: SampleRateHz;
  readonly channels?: number;
  readonly codec?: AudioCodec;
  readonly container?: AudioContainer;
  readonly metadata: TrackMetadata;
  readonly warnings: readonly CompatibilityWarning[];
};

export function createTrackInspection(input: TrackInspection): TrackInspection {
  return input;
}
