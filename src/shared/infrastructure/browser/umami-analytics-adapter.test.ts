import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNoopAnalyticsAdapter } from './noop-analytics-adapter';
import { createUmamiAnalyticsAdapter } from './umami-analytics-adapter';
import { createBestAvailableAnalyticsAdapter } from './analytics-adapter-factory';

describe('Analytics Adapters', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    delete (window as { umami?: unknown }).umami;
  });

  afterEach(() => {
    document.head.innerHTML = '';
    delete (window as { umami?: unknown }).umami;
    vi.restoreAllMocks();
  });

  describe('createNoopAnalyticsAdapter', () => {
    it('provides no-op implementations of init and trackPageView', () => {
      const adapter = createNoopAnalyticsAdapter();
      expect(() => {
        adapter.init();
        adapter.trackPageView('/test');
      }).not.toThrow();
    });
  });

  describe('createUmamiAnalyticsAdapter', () => {
    it('does not inject script if websiteId is missing', () => {
      const adapter = createUmamiAnalyticsAdapter({ websiteId: '' });
      adapter.init();
      expect(document.querySelector('script')).toBeNull();
    });

    it('injects script tag into document.head with default /stats proxy settings', () => {
      const adapter = createUmamiAnalyticsAdapter({
        websiteId: 'test-website-id',
      });

      adapter.init();

      const script = document.querySelector<HTMLScriptElement>(
        'script[data-website-id="test-website-id"]',
      );
      expect(script).not.toBeNull();
      expect(script?.getAttribute('src')).toBe('/stats/script.js');
      expect(script?.getAttribute('data-host-url')).toBe('/stats');
      expect(script?.async).toBe(true);
      expect(script?.defer).toBe(true);
    });

    it('allows overriding scriptUrl and hostUrl via options', () => {
      const adapter = createUmamiAnalyticsAdapter({
        scriptUrl: 'https://analytics.example.com/script.js',
        hostUrl: 'https://analytics.example.com',
        websiteId: 'custom-website-id',
      });

      adapter.init();

      const script = document.querySelector<HTMLScriptElement>(
        'script[data-website-id="custom-website-id"]',
      );
      expect(script).not.toBeNull();
      expect(script?.getAttribute('src')).toBe('https://analytics.example.com/script.js');
      expect(script?.getAttribute('data-host-url')).toBe('https://analytics.example.com');
    });

    it('does not inject duplicate script tags on multiple init calls', () => {
      const adapter = createUmamiAnalyticsAdapter({
        websiteId: 'test-website-id',
      });

      adapter.init();
      adapter.init();

      const scripts = document.querySelectorAll('script[data-website-id="test-website-id"]');
      expect(scripts.length).toBe(1);
    });

    it('calls window.umami.track when trackPageView is called', () => {
      const trackFn = vi.fn();
      (window as { umami?: unknown }).umami = { track: trackFn };

      const adapter = createUmamiAnalyticsAdapter({
        websiteId: 'test-website-id',
      });

      adapter.trackPageView('/workbench');
      expect(trackFn).toHaveBeenCalledWith({ url: '/workbench' });

      adapter.trackPageView();
      expect(trackFn).toHaveBeenCalledWith();
    });

    it('handles script load errors gracefully without throwing', () => {
      const adapter = createUmamiAnalyticsAdapter({
        websiteId: 'test-website-id',
      });

      adapter.init();
      const script = document.querySelector('script');
      expect(() => {
        script?.dispatchEvent(new Event('error'));
      }).not.toThrow();
    });
  });

  describe('createBestAvailableAnalyticsAdapter', () => {
    it('returns an AnalyticsPort instance', () => {
      const adapter = createBestAvailableAnalyticsAdapter();
      expect(typeof adapter.init).toBe('function');
      expect(typeof adapter.trackPageView).toBe('function');
    });
  });
});
