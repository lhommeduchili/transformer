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
  const { compatibilityProfile } = preset;

  if (
    inspection.container !== undefined &&
    !compatibilityProfile.allowedContainers.includes(inspection.container)
  ) {
    warnings.push({
      type: 'unsupported_container',
      message: `${inspection.container} container is not in ${compatibilityProfile.name}; output will use ${preset.targetContainer}.`,
    });
  }

  if (
    inspection.codec !== undefined &&
    !compatibilityProfile.allowedCodecs.includes(inspection.codec)
  ) {
    warnings.push({
      type: 'unsupported_codec',
      message: `${inspection.codec} codec is not in ${compatibilityProfile.name}; output will use ${preset.targetCodec}.`,
    });
  }

  if (inspection.container !== preset.targetContainer || inspection.codec !== preset.targetCodec) {
    warnings.push({
      type: 'planned_conversion',
      message: `will be prepared as ${preset.targetContainer} ${preset.targetCodec} for ${preset.compatibilityProfile.name}.`,
    });
  }

  if (inspection.container === undefined || inspection.codec === undefined) {
    warnings.push({
      type: 'inspection_incomplete',
      message: 'container or codec could not be confirmed before conversion.',
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

  if (preset.sampleRateHz !== undefined && inspection.sampleRateHz === undefined) {
    warnings.push({
      type: 'inspection_incomplete',
      message: `sample rate could not be confirmed; output will target ${preset.sampleRateHz}hz.`,
    });
  }

  if (
    preset.bitrateKbps !== undefined &&
    inspection.bitrateKbps !== undefined &&
    inspection.bitrateKbps !== preset.bitrateKbps
  ) {
    warnings.push({
      type: 'non_preferred_bitrate',
      message: `will be encoded at ${preset.bitrateKbps}kbps for ${preset.compatibilityProfile.name}.`,
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

  if (preset.channels === 'stereo' && inspection.channels === undefined) {
    warnings.push({
      type: 'inspection_incomplete',
      message: 'channel count could not be confirmed; output will target stereo.',
    });
  }

  if (inspection.metadataAssessment.completeness !== 'complete') {
    warnings.push({
      type: 'metadata_incomplete',
      message: `metadata is ${inspection.metadataAssessment.completeness}; missing ${inspection.metadataAssessment.missingFields.join(', ')}.`,
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
