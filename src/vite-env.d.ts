/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

import type { DesktopOutputApi } from './features/output/application/desktop-output-api';

declare global {
  interface Window {
    readonly transformerDesktop?: DesktopOutputApi;
    readonly umami?: {
      readonly track: (payload?: { url?: string }) => void;
    };
  }
}

interface ImportMetaEnv {
  readonly VITE_UMAMI_SCRIPT_URL?: string;
  readonly VITE_UMAMI_HOST_URL?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
