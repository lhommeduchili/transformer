import type { AnalyticsPort } from '../../application/analytics-port';

export function createNoopAnalyticsAdapter(): AnalyticsPort {
  return {
    init: () => undefined,
    trackPageView: () => undefined,
  };
}
