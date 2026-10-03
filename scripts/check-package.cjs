const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { resolve, join } = require('node:path');

const output = resolve(`out/Remed-${process.platform}-${process.arch}`);
const executable = process.argv[2] ? resolve(process.argv[2]) : join(output,
  process.platform === 'darwin' ? 'Remed.app/Contents/MacOS/Remed' : process.platform === 'win32' ? 'Remed.exe' : 'Remed');
const userData = mkdtempSync(join(tmpdir(), 'remed-package-check-'));
const env = { ...process.env };
delete env.NODE_PATH;
delete env.NODE_OPTIONS;
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(executable, ['--check-runtime', `--user-data-dir=${userData}`], {
  cwd: userData,
  env,
  stdio: 'inherit',
});
let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  console.error('Packaged app check exceeded 45 seconds');
  child.kill('SIGKILL');
}, 45000);
child.on('error', (error) => console.error(error.message));
child.on('close', (code) => {
  clearTimeout(timer);
  rmSync(userData, { recursive: true, force: true });
  process.exitCode = !timedOut && code === 0 ? 0 : 1;
});
