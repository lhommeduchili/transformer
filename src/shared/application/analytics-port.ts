export type AnalyticsPort = {
  readonly init: () => void;
  readonly trackPageView: (path?: string) => void;
};
