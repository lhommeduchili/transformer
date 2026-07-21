/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

import type { DesktopOutputApi } from './features/output/application/desktop-output-api';

declare global {
  interface Window {
    readonly transformerDesktop?: DesktopOutputApi;
  }
}
