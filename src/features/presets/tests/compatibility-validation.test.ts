import { describe, expect, it } from 'vitest';

import { createAudioAssetId } from '../../../shared/domain/ids';
import { createSampleRateHz } from '../../../shared/domain/numbers';
import type { TrackInspection } from '../../inspection/domain/track-inspection';
import { getDefaultPreset } from '../domain/built-in-presets';
import { validateInspectionForPreset } from '../domain/compatibility-validation';

function inspection(): TrackInspection {
  const assetId = createAudioAssetId('asset-1');
  const sampleRateHz = createSampleRateHz(44100);

  if (!assetId.ok || !sampleRateHz.ok) throw new Error('Invalid fixture.');

  return {
    assetId: assetId.value,
    sampleRateHz: sampleRateHz.value,
    channels: 2,
    codec: 'flac',
    container: 'flac',
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
});
