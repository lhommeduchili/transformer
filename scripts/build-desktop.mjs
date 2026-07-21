import { build } from 'esbuild';

const shared = {
  bundle: true,
  external: ['electron'],
  format: 'cjs',
  logLevel: 'info',
  minify: true,
  outExtension: { '.js': '.cjs' },
  platform: 'node',
  sourcemap: false,
  target: 'node22',
};

await Promise.all([
  build({ ...shared, entryPoints: ['desktop/main.ts'], outdir: 'desktop-dist' }),
  build({ ...shared, entryPoints: ['desktop/preload.ts'], outdir: 'desktop-dist' }),
]);
