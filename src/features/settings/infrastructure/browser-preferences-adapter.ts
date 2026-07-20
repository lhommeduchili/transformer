import { createPresetId } from '../../../shared/domain/ids';
import type { PreferencesPort, UserPreferences } from '../application/preferences-port';

const storageKey = 'transformer.preferences.v1';

export function createBrowserPreferencesAdapter(storage?: Storage): PreferencesPort {
  const resolvedStorage = storage ?? browserStorage();
  return {
    load: () => (resolvedStorage === undefined ? {} : readPreferences(resolvedStorage)),
    save: (preferences) => {
      try {
        resolvedStorage?.setItem(storageKey, JSON.stringify(preferences));
      } catch {
        return;
      }
    },
  };
}

function browserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function readPreferences(storage: Storage): UserPreferences {
  try {
    const value: unknown = JSON.parse(storage.getItem(storageKey) ?? '{}');
    if (typeof value !== 'object' || value === null || !('presetId' in value)) return {};
    if (typeof value.presetId !== 'string') return {};
    const presetId = createPresetId(value.presetId);
    return presetId.ok ? { presetId: presetId.value } : {};
  } catch {
    return {};
  }
}
