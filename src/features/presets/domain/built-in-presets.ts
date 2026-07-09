import { createPresetId, type PresetId } from '../../../shared/domain/ids';
import {
  createBitrateKbps,
  createSampleRateHz,
  type BitrateKbps,
  type SampleRateHz,
} from '../../../shared/domain/numbers';
import type { AudioCodec, AudioContainer, ChannelMode } from './audio-format';
import { createCompatibilityProfile, type CompatibilityProfile } from './compatibility-profile';
import { cdjSafeFilenamePolicy, type FilenamePolicy } from './filename-policy';
import type { MetadataPolicy } from './metadata-policy';
import { createConversionPreset, type ConversionPreset } from './conversion-preset';

export const defaultPresetId = 'cdj_rekordbox_safe_aiff';

function trustedPresetId(value: string): PresetId {
  const id = createPresetId(value);

  if (!id.ok) {
    throw new Error(`Invalid built-in preset id: ${value}`);
  }

  return id.value;
}

function trustedSampleRate(value: number): SampleRateHz {
  const sampleRate = createSampleRateHz(value);

  if (!sampleRate.ok) {
    throw new Error(`Invalid built-in sample rate: ${value}`);
  }

  return sampleRate.value;
}

function trustedBitrate(value: number): BitrateKbps {
  const bitrate = createBitrateKbps(value);

  if (!bitrate.ok) {
    throw new Error(`Invalid built-in bitrate: ${value}`);
  }

  return bitrate.value;
}

const sampleRate44100 = trustedSampleRate(44100);
const mp3Bitrate320 = trustedBitrate(320);
const preserveMetadata: MetadataPolicy = { mode: 'preserve' };

function profile(input: CompatibilityProfile): CompatibilityProfile {
  return createCompatibilityProfile(input);
}

function preset(input: {
  readonly id: string;
  readonly name: string;
  readonly targetContainer: AudioContainer;
  readonly targetCodec: AudioCodec;
  readonly bitrateKbps?: BitrateKbps;
  readonly sampleRateHz?: SampleRateHz;
  readonly channels: ChannelMode;
  readonly metadataPolicy: MetadataPolicy;
  readonly filenamePolicy: FilenamePolicy;
  readonly compatibilityProfile: CompatibilityProfile;
}): ConversionPreset {
  const created = createConversionPreset({ ...input, id: trustedPresetId(input.id) });

  if (!created.ok) {
    throw new Error(`Invalid built-in preset: ${input.name}`);
  }

  return created.value;
}

export const builtInPresets: readonly ConversionPreset[] = [
  preset({
    id: defaultPresetId,
    name: 'cdj / rekordbox safe aiff',
    targetContainer: 'aiff',
    targetCodec: 'pcm_s16be',
    sampleRateHz: sampleRate44100,
    channels: 'stereo',
    metadataPolicy: preserveMetadata,
    filenamePolicy: cdjSafeFilenamePolicy,
    compatibilityProfile: profile({
      id: 'aiff_archival',
      name: 'cdj / rekordbox safe aiff',
      allowedContainers: ['aiff'],
      allowedCodecs: ['pcm_s16be'],
      preferredSampleRateHz: sampleRate44100,
      preferredChannels: 'stereo',
      requiresSanitizedFilename: true,
      notes: ['best default for flac-to-aiff preparation for cdj/rekordbox workflows.'],
    }),
  }),
  preset({
    id: 'cdj_rekordbox_safe_mp3_320',
    name: 'cdj / rekordbox safe mp3 320',
    targetContainer: 'mp3',
    targetCodec: 'mp3',
    bitrateKbps: mp3Bitrate320,
    sampleRateHz: sampleRate44100,
    channels: 'stereo',
    metadataPolicy: preserveMetadata,
    filenamePolicy: cdjSafeFilenamePolicy,
    compatibilityProfile: profile({
      id: 'cdj_safe_mp3',
      name: 'cdj / rekordbox safe mp3 320',
      allowedContainers: ['mp3'],
      allowedCodecs: ['mp3'],
      preferredSampleRateHz: sampleRate44100,
      preferredBitrateKbps: mp3Bitrate320,
      preferredChannels: 'stereo',
      requiresSanitizedFilename: true,
      notes: ['broad compatibility fallback when smaller files are preferred.'],
    }),
  }),
  preset({
    id: 'wav_archival_44100',
    name: 'wav archival 44.1khz',
    targetContainer: 'wav',
    targetCodec: 'pcm_s16le',
    sampleRateHz: sampleRate44100,
    channels: 'stereo',
    metadataPolicy: preserveMetadata,
    filenamePolicy: cdjSafeFilenamePolicy,
    compatibilityProfile: profile({
      id: 'wav_archival',
      name: 'wav archival 44.1khz',
      allowedContainers: ['wav'],
      allowedCodecs: ['pcm_s16le'],
      preferredSampleRateHz: sampleRate44100,
      preferredChannels: 'stereo',
      requiresSanitizedFilename: true,
      notes: ['uncompressed pcm option with broad software support.'],
    }),
  }),
];

export function getDefaultPreset(): ConversionPreset {
  const preset = builtInPresets[0];

  if (preset === undefined) {
    throw new Error('No built-in presets are configured.');
  }

  return preset;
}
