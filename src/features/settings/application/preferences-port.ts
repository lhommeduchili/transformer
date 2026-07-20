import type { PresetId } from '../../../shared/domain/ids';

export type UserPreferences = {
  readonly presetId?: PresetId;
};

export type PreferencesPort = {
  readonly load: () => UserPreferences;
  readonly save: (preferences: UserPreferences) => void;
};
