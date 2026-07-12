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
  readonly artworkPresent?: boolean;
};

export type MetadataAssessment = {
  readonly completeness: 'complete' | 'partial' | 'missing';
  readonly sourceFormat: 'id3' | 'vorbis' | 'mp4' | 'unknown';
  readonly missingFields: readonly ('title' | 'artist' | 'album')[];
  readonly artwork: 'present' | 'missing' | 'unknown';
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
  readonly metadataAssessment: MetadataAssessment;
  readonly warnings: readonly CompatibilityWarning[];
};

export function assessMetadata(
  metadata: TrackMetadata,
  sourceFormat: MetadataAssessment['sourceFormat'],
): MetadataAssessment {
  const missingFields = (['title', 'artist', 'album'] as const).filter((field) => !metadata[field]);

  return {
    completeness:
      missingFields.length === 0 ? 'complete' : missingFields.length === 3 ? 'missing' : 'partial',
    sourceFormat,
    missingFields,
    artwork:
      metadata.artworkPresent === true
        ? 'present'
        : metadata.artworkPresent === false
          ? 'missing'
          : 'unknown',
  };
}

export function createTrackInspection(input: TrackInspection): TrackInspection {
  return input;
}
