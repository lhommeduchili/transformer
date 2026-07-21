import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { FusesPlugin } from '@electron-forge/plugin-fuses';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const macSigningIdentity = process.env.MAC_SIGNING_IDENTITY ?? 'transformer self-sign';

const config: ForgeConfig = {
  packagerConfig: {
    appBundleId: 'com.lhommeduchili.transformer',
    appCategoryType: 'public.app-category.music',
    appCopyright: 'Copyright (c) 2026 lhommeduchili',
    asar: true,
    executableName: 'Transformer',
    icon: 'build/icon',
    ignore: [
      /^\/(?:\.ai|\.antigravity|\.chatgpt|\.claude|\.cursor|\.gemini|\.github|\.windsurf)(?:\/|$)/,
      /^\/(?:docs|playwright-report|public|scripts|src|test-results|tests)(?:\/|$)/,
      /^\/(?:forge\.config\.ts|playwright[^/]*\.config\.ts|progress_bar_issue\.png|tsconfig[^/]*|vite\.config\.ts|vitest\.setup\.ts)$/,
    ],
    osxSign: {
      identity: macSigningIdentity,
      identityValidation: false,
      preAutoEntitlements: false,
      preEmbedProvisioningProfile: false,
      optionsForFile: () => ({
        hardenedRuntime: false,
        timestamp: 'none',
      }),
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: { format: 'ULFO', name: 'Transformer' },
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-zip',
      config: {},
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Transformer',
        authors: 'lhommeduchili',
        description: 'Local-only DJ audio preparation and conversion.',
      },
      platforms: ['win32'],
    },
  ],
  plugins: [
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: true,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
    }),
  ],
  hooks: {
    postPackage: (_forgeConfig, packageResult) => {
      if (packageResult.platform !== 'darwin') return Promise.resolve();

      for (const outputPath of packageResult.outputPaths) {
        const appPath = join(outputPath, 'Transformer.app');
        if (!existsSync(appPath)) continue;

        execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], {
          stdio: 'inherit',
        });
      }

      return Promise.resolve();
    },
  },
};

export default config;
