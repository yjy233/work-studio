import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execute = promisify(execFile);
// Node subprocesses do not inherit macOS's system HTTP proxy automatically.
// Use the user's existing setting, without changing system or Codex configuration.
export async function codexEnvironment(): Promise<Record<string, string>> {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      (item): item is [string, string] => typeof item[1] === 'string',
    ),
  );
  if (
    process.platform !== 'darwin' ||
    env.HTTPS_PROXY ||
    env.https_proxy ||
    env.ALL_PROXY ||
    env.all_proxy ||
    env.STUDIO_SYSTEM_PROXY === '0'
  )
    return env;
  try {
    const { stdout } = await execute('/usr/sbin/scutil', ['--proxy'], { timeout: 2000 });
    const enabled = stdout.match(/^\s*HTTPSEnable\s*:\s*(\d+)/m)?.[1] === '1';
    const host = stdout.match(/^\s*HTTPSProxy\s*:\s*(\S+)/m)?.[1];
    const port = stdout.match(/^\s*HTTPSPort\s*:\s*(\d+)/m)?.[1];
    if (enabled && host && port) {
      env.HTTPS_PROXY = `http://${host}:${port}`;
      env.HTTP_PROXY ||= env.HTTPS_PROXY;
      env.NO_PROXY ||= 'localhost,127.0.0.1,::1';
    }
  } catch {
    /* Explicit environment and normal networking remain supported. */
  }
  return env;
}
