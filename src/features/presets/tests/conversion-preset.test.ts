import { describe, expect, it } from 'vitest';

import { createPresetId } from '../../../shared/domain/ids';
import { createBitrateKbps, createSampleRateHz } from '../../../shared/domain/numbers';
import { createCompatibilityProfile } from '../domain/compatibility-profile';
import { createConversionPreset } from '../domain/conversion-preset';
import { cdjSafeFilenamePolicy } from '../domain/filename-policy';

function cdjProfile() {
  const sampleRate = createSampleRateHz(44100);
  const bitrate = createBitrateKbps(320);

  if (!sampleRate.ok || !bitrate.ok) throw new Error('Invalid fixture.');

  return createCompatibilityProfile({
    id: 'cdj_safe_mp3',
    name: 'CDJ-safe MP3',
    allowedContainers: ['mp3'],
    allowedCodecs: ['mp3'],
    preferredSampleRateHz: sampleRate.value,
    preferredBitrateKbps: bitrate.value,
    preferredChannels: 'stereo',
    requiresSanitizedFilename: true,
    notes: ['Prefer 320kbps CBR MP3 for CDJ compatibility.'],
  });
}

function validPresetInput() {
  const id = createPresetId('preset-1');
  const bitrate = createBitrateKbps(320);
  const sampleRate = createSampleRateHz(44100);

  if (!id.ok || !bitrate.ok || !sampleRate.ok) throw new Error('Invalid fixture.');

  return {
    id: id.value,
    name: ' CDJ-safe MP3 ',
    targetContainer: 'mp3' as const,
    targetCodec: 'mp3' as const,
    bitrateKbps: bitrate.value,
    sampleRateHz: sampleRate.value,
    channels: 'stereo' as const,
    metadataPolicy: { mode: 'strip_unsupported' as const },
    filenamePolicy: cdjSafeFilenamePolicy,
    compatibilityProfile: cdjProfile(),
  };
}

describe('createConversionPreset', () => {
  it('creates a valid preset and trims the name', () => {
    const preset = createConversionPreset(validPresetInput());

    expect(preset.ok).toBe(true);
    if (!preset.ok) throw new Error('Expected valid preset.');
    expect(preset.value.name).toBe('CDJ-safe MP3');
  });

  it('rejects containers that are not allowed by the compatibility profile', () => {
    const preset = createConversionPreset({ ...validPresetInput(), targetContainer: 'wav' });

    expect(preset.ok).toBe(false);
    if (preset.ok) throw new Error('Expected invalid preset.');
    expect(preset.error.type).toBe('container_not_allowed_by_profile');
  });
});
