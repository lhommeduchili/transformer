import type { AnalyticsPort } from '../../application/analytics-port';

export type UmamiAnalyticsConfig = {
  readonly scriptUrl?: string;
  readonly hostUrl?: string;
  readonly websiteId?: string;
};

export function createUmamiAnalyticsAdapter(config?: UmamiAnalyticsConfig): AnalyticsPort {
  const env = import.meta.env as Record<string, unknown>;
  const defaultScriptUrl =
    typeof env['VITE_UMAMI_SCRIPT_URL'] === 'string'
      ? env['VITE_UMAMI_SCRIPT_URL']
      : '/stats/script.js';
  const defaultHostUrl =
    typeof env['VITE_UMAMI_HOST_URL'] === 'string' ? env['VITE_UMAMI_HOST_URL'] : '/stats';
  const defaultWebsiteId =
    typeof env['VITE_UMAMI_WEBSITE_ID'] === 'string' ? env['VITE_UMAMI_WEBSITE_ID'] : undefined;

  const scriptUrl = config?.scriptUrl ?? defaultScriptUrl;
  const hostUrl = config?.hostUrl ?? defaultHostUrl;
  const websiteId = config?.websiteId ?? defaultWebsiteId;

  return {
    init: () => {
      if (typeof document === 'undefined' || !scriptUrl || !websiteId) {
        return;
      }

      const existingScript = document.querySelector(`script[data-website-id="${websiteId}"]`);
      if (existingScript) {
        return;
      }

      try {
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = scriptUrl;
        script.setAttribute('data-website-id', websiteId);
        if (hostUrl) {
          script.setAttribute('data-host-url', hostUrl);
        }
        script.onerror = () => {
          // Silent catch for offline mode or network/adblock failures
        };

        document.head.appendChild(script);
      } catch {
        // Prevent any unexpected DOM insertion errors from leaking
      }
    },
    trackPageView: (path?: string) => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        if (typeof window.umami?.track === 'function') {
          if (path) {
            window.umami.track({ url: path });
          } else {
            window.umami.track();
          }
        }
      } catch {
        // Silent catch to protect application flow
      }
    },
  };
}
