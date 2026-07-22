import type { AnalyticsPort } from '../../application/analytics-port';
import { analyticsConfig } from '../../../config/analytics-config';
import { createNoopAnalyticsAdapter } from './noop-analytics-adapter';
import { createUmamiAnalyticsAdapter } from './umami-analytics-adapter';

export function createBestAvailableAnalyticsAdapter(): AnalyticsPort {
  const env = import.meta.env as Record<string, unknown>;
  const websiteId =
    typeof env['VITE_UMAMI_WEBSITE_ID'] === 'string' && env['VITE_UMAMI_WEBSITE_ID'].length > 0
      ? env['VITE_UMAMI_WEBSITE_ID']
      : analyticsConfig.websiteId;

  if (websiteId && websiteId.length > 0) {
    return createUmamiAnalyticsAdapter({
      websiteId,
      scriptUrl: analyticsConfig.scriptUrl,
      hostUrl: analyticsConfig.hostUrl,
    });
  }

  return createNoopAnalyticsAdapter();
}
