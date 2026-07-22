/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-not-to-application',
      severity: 'error',
      from: { path: '^src/.*/domain/' },
      to: { path: '^src/.*/application/' },
    },
    {
      name: 'domain-not-to-ui',
      severity: 'error',
      from: { path: '^src/.*/domain/' },
      to: { path: '^src/.*/ui/' },
    },
    {
      name: 'domain-not-to-infrastructure',
      severity: 'error',
      from: { path: '^src/.*/domain/' },
      to: { path: '^src/.*/infrastructure/' },
    },
    {
      name: 'domain-not-to-react-or-state-or-ffmpeg',
      severity: 'error',
      from: { path: '^src/.*/domain/' },
      to: { dependencyTypes: ['npm'], path: '^(react|react-dom|zustand|@ffmpeg/)' },
    },
    {
      name: 'application-not-to-ui',
      severity: 'error',
      from: { path: '^src/.*/application/' },
      to: { path: '^src/.*/ui/' },
    },
    {
      name: 'application-not-to-infrastructure',
      severity: 'error',
      from: { path: '^src/.*/application/' },
      to: { path: '^src/.*/infrastructure/' },
    },
    {
      name: 'ui-not-to-workers-or-ffmpeg',
      severity: 'error',
      from: { path: '^src/.*/ui/' },
      to: { path: '^src/(workers|.*/workers/)|node_modules/@ffmpeg/' },
    },
    {
      name: 'ui-not-to-infrastructure',
      severity: 'error',
      from: { path: '^(src/.*/ui/|src/app/App\\.tsx)' },
      to: { path: '^src/.*/infrastructure/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    includeOnly: '^src',
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    reporterOptions: {
      dot: { collapsePattern: 'node_modules/[^/]+' },
    },
  },
};
