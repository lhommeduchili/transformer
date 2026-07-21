import { execFileSync } from 'node:child_process';

if (process.platform === 'darwin') {
  execFileSync('npm', ['rebuild', 'fs-xattr', 'macos-alias'], { stdio: 'inherit' });
}
