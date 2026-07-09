import type { PresetId } from '../../../shared/domain/ids';
import type { BitrateKbps, SampleRateHz } from '../../../shared/domain/numbers';
import { err, ok, type Result } from '../../../shared/domain/result';
import type { AudioCodec, AudioContainer, ChannelMode } from './audio-format';
import type { CompatibilityProfile } from './compatibility-profile';
import type { FilenamePolicy } from './filename-policy';
import type { MetadataPolicy } from './metadata-policy';

export type ConversionPreset = {
  readonly id: PresetId;
  readonly name: string;
  readonly targetContainer: AudioContainer;
  readonly targetCodec: AudioCodec;
  readonly bitrateKbps?: BitrateKbps;
  readonly sampleRateHz?: SampleRateHz;
  readonly channels: ChannelMode;
  readonly metadataPolicy: MetadataPolicy;
  readonly filenamePolicy: FilenamePolicy;
  readonly compatibilityProfile: CompatibilityProfile;
};

export type ConversionPresetError =
  | { readonly type: 'empty_preset_name' }
  | { readonly type: 'container_not_allowed_by_profile'; readonly container: AudioContainer }
  | { readonly type: 'codec_not_allowed_by_profile'; readonly codec: AudioCodec };

export function createConversionPreset(
  input: ConversionPreset,
): Result<ConversionPreset, ConversionPresetError> {
  if (input.name.trim().length === 0) {
    return err({ type: 'empty_preset_name' });
  }

  if (!input.compatibilityProfile.allowedContainers.includes(input.targetContainer)) {
    return err({
      type: 'container_not_allowed_by_profile',
      container: input.targetContainer,
    });
  }

  if (!input.compatibilityProfile.allowedCodecs.includes(input.targetCodec)) {
    return err({ type: 'codec_not_allowed_by_profile', codec: input.targetCodec });
  }

  return ok({ ...input, name: input.name.trim() });
}
