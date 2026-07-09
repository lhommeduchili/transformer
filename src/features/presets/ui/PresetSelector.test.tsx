import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { builtInPresets, getDefaultPreset } from '../domain/built-in-presets';
import { PresetSelector } from './PresetSelector';

describe('PresetSelector', () => {
  it('renders the default aiff preset and target facts', () => {
    render(
      <PresetSelector
        presets={builtInPresets}
        selectedPreset={getDefaultPreset()}
        onPresetSelected={() => undefined}
      />,
    );

    expect(screen.getByLabelText(/preset/i)).toHaveValue(getDefaultPreset().id);
    expect(screen.getByText(/aiff \/ pcm_s16be \/ 44100hz \/ stereo/i)).toBeInTheDocument();
  });

  it('emits selected presets', () => {
    const onPresetSelected = vi.fn();

    render(
      <PresetSelector
        presets={builtInPresets}
        selectedPreset={getDefaultPreset()}
        onPresetSelected={onPresetSelected}
      />,
    );

    fireEvent.change(screen.getByLabelText(/preset/i), {
      target: { value: builtInPresets[1]?.id },
    });

    expect(onPresetSelected).toHaveBeenCalledWith(builtInPresets[1]);
  });
});
