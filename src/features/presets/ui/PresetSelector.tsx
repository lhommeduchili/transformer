import type { ConversionPreset } from '../domain/conversion-preset';

type PresetSelectorProps = {
  readonly presets: readonly ConversionPreset[];
  readonly selectedPreset: ConversionPreset;
  readonly onPresetSelected: (preset: ConversionPreset) => void;
};

export function PresetSelector({ presets, selectedPreset, onPresetSelected }: PresetSelectorProps) {
  return (
    <section className="panel setup-panel">
      <h2 id="preset-title">preset</h2>

      <label className="visually-hidden" htmlFor="preset-selector">
        preset
      </label>
      <select
        id="preset-selector"
        value={selectedPreset.id}
        onChange={(event) => {
          const nextPreset = presets.find((preset) => preset.id === event.currentTarget.value);

          if (nextPreset !== undefined) {
            onPresetSelected(nextPreset);
          }
        }}
      >
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>

      <p className="setting-value">
        {selectedPreset.targetContainer} / {selectedPreset.targetCodec} /{' '}
        {selectedPreset.sampleRateHz ?? 'source'}hz / {selectedPreset.channels}
      </p>
    </section>
  );
}
