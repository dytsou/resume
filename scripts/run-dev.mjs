import { spawn } from 'node:child_process';

/** @param {string} cmd @param {string[]} args */
function run(cmd, args) {
  return spawn(cmd, args, { stdio: 'inherit', shell: false });
}

const compile = run('node', ['scripts/dev-compile-server.mjs']);
const vite = run('pnpm', ['exec', 'vite']);

let exiting = false;

/** @param {number} code */
function shutdown(code = 0) {
  if (exiting) return;
  exiting = true;
  compile.kill('SIGTERM');
  vite.kill('SIGTERM');
  setTimeout(() => process.exit(code), 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
compile.on('exit', (code) => {
  if (code && code !== 0) shutdown(code);
});
vite.on('exit', (code) => {
  if (code && code !== 0) shutdown(code);
});
