import { builtInPresets, getDefaultPreset } from '../domain/built-in-presets';
import type { ConversionPreset } from '../domain/conversion-preset';

export function getAvailablePresets(): readonly ConversionPreset[] {
  return builtInPresets;
}

export function getInitialPreset(): ConversionPreset {
  return getDefaultPreset();
}
