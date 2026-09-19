import { createRequire } from 'node:module';
import { chmodSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
// node-pty 1.1.0 ships macOS helpers without the executable bit (upstream #850).
if (process.platform === 'darwin') {
  const require = createRequire(import.meta.url);
  const root = path.dirname(require.resolve('node-pty/package.json'));
  for (const relative of [
    `prebuilds/darwin-${process.arch}/spawn-helper`,
    'build/Release/spawn-helper',
  ]) {
    const helper = path.join(root, relative);
    if (existsSync(helper)) chmodSync(helper, statSync(helper).mode | 0o111);
  }
}
