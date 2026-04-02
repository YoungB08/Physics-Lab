import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const api = path.join(root, 'apps', 'api');
const isWin = process.platform === 'win32';
function run(cmd, args, cwd=root) {
  console.log(`
> ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run('docker', ['compose', 'up', '-d']);
run('npx', ['prisma', 'migrate', 'reset', '--force'], api);
run('npm', ['run', 'prisma:seed'], api);
console.log('
Đã làm mới database.');
