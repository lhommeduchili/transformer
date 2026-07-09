import type { TrackInspection } from '../../inspection/domain/track-inspection';
import { validateInspectionsForPreset } from '../domain/compatibility-validation';
import type { CompatibilityValidation } from '../domain/compatibility-validation';
import type { ConversionPreset } from '../domain/conversion-preset';

export function validateAssetsForPreset(
  inspections: readonly TrackInspection[],
  preset: ConversionPreset,
): readonly CompatibilityValidation[] {
  return validateInspectionsForPreset(inspections, preset);
}
