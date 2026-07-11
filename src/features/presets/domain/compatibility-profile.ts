import type { BitrateKbps, SampleRateHz } from '../../../shared/domain/numbers';
import type { AudioCodec, AudioContainer, ChannelMode } from './audio-format';

export type CompatibilityProfileId =
  | 'cdj_safe_mp3'
  | 'rekordbox_compatible_mp3'
  | 'wav_archival'
  | 'aiff_archival'
  | 'generic_browser_compatible';

export type CompatibilityProfile = {
  readonly id: CompatibilityProfileId;
  readonly name: string;
  readonly allowedContainers: readonly AudioContainer[];
  readonly allowedCodecs: readonly AudioCodec[];
  readonly preferredSampleRateHz?: SampleRateHz;
  readonly preferredBitrateKbps?: BitrateKbps;
  readonly preferredChannels: ChannelMode;
  readonly requiresSanitizedFilename: boolean;
  readonly notes: readonly string[];
};

export type CompatibilityWarning = {
  readonly type:
    | 'unsupported_container'
    | 'unsupported_codec'
    | 'non_preferred_sample_rate'
    | 'non_preferred_bitrate'
    | 'metadata_may_be_unsupported'
    | 'filename_requires_sanitization'
    | 'inspection_incomplete'
    | 'metadata_incomplete'
    | 'planned_conversion';
  readonly message: string;
};

export function createCompatibilityProfile(input: CompatibilityProfile): CompatibilityProfile {
  return input;
}
