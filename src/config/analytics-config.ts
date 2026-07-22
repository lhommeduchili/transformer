export type AnalyticsConfig = {
  readonly websiteId: string;
  readonly scriptUrl: string;
  readonly hostUrl: string;
};

export const analyticsConfig: AnalyticsConfig = {
  websiteId: '93dfff3f-c5f3-4400-85ed-a185cf1fc7c1',
  scriptUrl: '/stats/script.js',
  hostUrl: '/stats',
};
