import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaStatus() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (needRefresh) {
    return (
      <aside className="pwa-notice" aria-live="polite">
        <p>an update is ready</p>
        <p className="control-guidance">finish active conversions before reloading</p>
        <button
          className="secondary-action"
          type="button"
          onClick={() => {
            void updateServiceWorker(true);
          }}
        >
          reload update
        </button>
      </aside>
    );
  }

  return null;
}
