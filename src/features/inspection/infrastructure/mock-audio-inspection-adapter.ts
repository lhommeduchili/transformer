import { createBitrateKbps, createSampleRateHz } from '../../../shared/domain/numbers';
import type { AudioAsset } from '../../import/domain/audio-asset';
import type { AudioCodec, AudioContainer } from '../../presets/domain/audio-format';
import type { CompatibilityWarning } from '../../presets/domain/compatibility-profile';
import type { AudioInspectionPort } from '../application/audio-inspection-port';
import { createTrackInspection, type TrackInspection } from '../domain/track-inspection';

function trustedSampleRate() {
  const sampleRate = createSampleRateHz(44100);

  if (!sampleRate.ok) {
    throw new Error('Invalid DJ-safe mock sample rate.');
  }

  return sampleRate.value;
}

function trustedBitrate() {
  const bitrate = createBitrateKbps(320);

  if (!bitrate.ok) {
    throw new Error('Invalid DJ-safe mock bitrate.');
  }

  return bitrate.value;
}

const djSafeSampleRate = trustedSampleRate();
const djSafeBitrate = trustedBitrate();

export function createMockAudioInspectionAdapter(): AudioInspectionPort {
  return {
    inspect: (assets) => Promise.resolve(assets.map(inspectAsset)),
  };
}

function inspectAsset(asset: AudioAsset): TrackInspection {
  const format = formatFromExtension(asset.extension);

  return createTrackInspection({
    assetId: asset.id,
    ...(format.container === 'mp3' ? { bitrateKbps: djSafeBitrate } : {}),
    sampleRateHz: djSafeSampleRate,
    channels: 2,
    codec: format.codec,
    container: format.container,
    metadata: {},
    warnings: warningsForFormat(format.container),
  });
}

function formatFromExtension(extension: string): {
  readonly container: AudioContainer;
  readonly codec: AudioCodec;
} {
  switch (extension) {
    case 'mp3':
      return { container: 'mp3', codec: 'mp3' };
    case 'wav':
      return { container: 'wav', codec: 'pcm_s16le' };
    case 'aiff':
    case 'aif':
      return { container: 'aiff', codec: 'pcm_s16be' };
    case 'flac':
      return { container: 'flac', codec: 'flac' };
    case 'm4a':
    case 'aac':
      return { container: 'm4a', codec: 'aac' };
    case 'ogg':
      return { container: 'ogg', codec: 'vorbis' };
    default:
      return { container: 'unknown', codec: 'unknown' };
  }
}

function warningsForFormat(container: AudioContainer): readonly CompatibilityWarning[] {
  const warnings: CompatibilityWarning[] = [
    {
      type: 'inspection_incomplete',
      message: 'inspection is mocked in this phase; real metadata parsing is not active yet.',
    },
  ];

  if (container !== 'mp3') {
    warnings.push({
      type: 'planned_conversion',
      message: 'default workflow will prepare this for cdj/rekordbox-safe aiff output.',
    });
  }

  return warnings;
}
