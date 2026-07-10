import { describe, expect, it } from 'vitest';

import { createAudioAssetId } from '../../../shared/domain/ids';
import { createBitrateKbps, createSampleRateHz } from '../../../shared/domain/numbers';
import type { TrackInspection } from '../../inspection/domain/track-inspection';
import { builtInPresets, getDefaultPreset } from '../domain/built-in-presets';
import { validateInspectionForPreset } from '../domain/compatibility-validation';
import type { AudioCodec, AudioContainer } from '../domain/audio-format';

type InspectionOverrides = {
  readonly bitrateKbps?: TrackInspection['bitrateKbps'] | undefined;
  readonly channels?: TrackInspection['channels'] | undefined;
  readonly codec?: TrackInspection['codec'] | undefined;
  readonly container?: TrackInspection['container'] | undefined;
  readonly sampleRateHz?: TrackInspection['sampleRateHz'] | undefined;
};

function inspection(overrides: InspectionOverrides = {}): TrackInspection {
  const assetId = createAudioAssetId('asset-1');
  const sampleRateHz = createSampleRateHz(44100);

  if (!assetId.ok || !sampleRateHz.ok) throw new Error('Invalid fixture.');

  const resolved = {
    bitrateKbps: overrides.bitrateKbps,
    channels: 'channels' in overrides ? overrides.channels : 2,
    codec: 'codec' in overrides ? overrides.codec : 'flac',
    container: 'container' in overrides ? overrides.container : 'flac',
    sampleRateHz: 'sampleRateHz' in overrides ? overrides.sampleRateHz : sampleRateHz.value,
  };

  return {
    assetId: assetId.value,
    ...(resolved.bitrateKbps === undefined ? {} : { bitrateKbps: resolved.bitrateKbps }),
    ...(resolved.channels === undefined ? {} : { channels: resolved.channels }),
    ...(resolved.codec === undefined ? {} : { codec: resolved.codec }),
    ...(resolved.container === undefined ? {} : { container: resolved.container }),
    ...(resolved.sampleRateHz === undefined ? {} : { sampleRateHz: resolved.sampleRateHz }),
    metadata: {},
    warnings: [],
  };
}

describe('validateInspectionForPreset', () => {
  it('plans flac conversion to aiff by default', () => {
    const validation = validateInspectionForPreset(inspection(), getDefaultPreset());

    expect(validation.warnings.some((warning) => warning.type === 'planned_conversion')).toBe(true);
    expect(validation.warnings.some((warning) => warning.message.includes('aiff'))).toBe(true);
  });

  it('identifies unsupported source container and codec for the target profile', () => {
    const validation = validateInspectionForPreset(inspection(), getDefaultPreset());

    expect(validation.warnings).toContainEqual(
      expect.objectContaining({ type: 'unsupported_container' }),
    );
    expect(validation.warnings).toContainEqual(
      expect.objectContaining({ type: 'unsupported_codec' }),
    );
  });

  it('warns when inspection data is incomplete before conversion', () => {
    const validation = validateInspectionForPreset(
      inspection({
        channels: undefined,
        codec: undefined,
        container: undefined,
        sampleRateHz: undefined,
      }),
      getDefaultPreset(),
    );

    expect(
      validation.warnings.some(
        (warning) =>
          warning.type === 'inspection_incomplete' &&
          warning.message.includes('container or codec'),
      ),
    ).toBe(true);
    expect(
      validation.warnings.some(
        (warning) =>
          warning.type === 'inspection_incomplete' && warning.message.includes('sample rate'),
      ),
    ).toBe(true);
    expect(
      validation.warnings.some(
        (warning) =>
          warning.type === 'inspection_incomplete' && warning.message.includes('channel count'),
      ),
    ).toBe(true);
  });

  it('warns when mp3 bitrate differs from a 320kbps target preset', () => {
    const preset = builtInPresets.find((candidate) => candidate.targetContainer === 'mp3');
    const bitrate = createBitrateKbps(128);

    if (preset === undefined || !bitrate.ok) throw new Error('Invalid fixture.');

    const validation = validateInspectionForPreset(
      inspection({
        bitrateKbps: bitrate.value,
        codec: 'mp3' satisfies AudioCodec,
        container: 'mp3' satisfies AudioContainer,
      }),
      preset,
    );

    expect(validation.warnings).toContainEqual(
      expect.objectContaining({ type: 'non_preferred_bitrate' }),
    );
    expect(validation.warnings.some((warning) => warning.message.includes('320kbps'))).toBe(true);
  });
});
