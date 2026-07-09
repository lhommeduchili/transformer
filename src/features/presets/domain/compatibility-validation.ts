import type { TrackInspection } from '../../inspection/domain/track-inspection';
import type { CompatibilityWarning } from './compatibility-profile';
import type { ConversionPreset } from './conversion-preset';

export type CompatibilityValidation = {
  readonly inspection: TrackInspection;
  readonly warnings: readonly CompatibilityWarning[];
};

export function validateInspectionForPreset(
  inspection: TrackInspection,
  preset: ConversionPreset,
): CompatibilityValidation {
  const warnings: CompatibilityWarning[] = [...inspection.warnings];

  if (inspection.container !== preset.targetContainer || inspection.codec !== preset.targetCodec) {
    warnings.push({
      type: 'planned_conversion',
      message: `will be prepared as ${preset.targetContainer} ${preset.targetCodec} for ${preset.compatibilityProfile.name}.`,
    });
  }

  if (
    preset.sampleRateHz !== undefined &&
    inspection.sampleRateHz !== undefined &&
    inspection.sampleRateHz !== preset.sampleRateHz
  ) {
    warnings.push({
      type: 'non_preferred_sample_rate',
      message: `will be resampled to ${preset.sampleRateHz}hz for dj compatibility.`,
    });
  }

  if (
    preset.channels === 'stereo' &&
    inspection.channels !== undefined &&
    inspection.channels !== 2
  ) {
    warnings.push({
      type: 'planned_conversion',
      message: 'will be rendered as stereo for dj hardware/software compatibility.',
    });
  }

  return { inspection, warnings };
}

export function validateInspectionsForPreset(
  inspections: readonly TrackInspection[],
  preset: ConversionPreset,
): readonly CompatibilityValidation[] {
  return inspections.map((inspection) => validateInspectionForPreset(inspection, preset));
}
