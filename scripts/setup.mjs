import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const api = path.join(root, 'apps', 'api');

function run(cmd, args, cwd = root) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const isWin = process.platform === 'win32';
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function ensureEnv() {
  const rootEnv = path.join(root, '.env');
  if (!existsSync(rootEnv)) copyFileSync(path.join(root, '.env.example'), rootEnv);
}

ensureEnv();
run('npm', ['install']);
run('docker', ['compose', 'up', '-d']);
run('npx', ['prisma', 'generate'], api);
run('npx', ['prisma', 'db', 'push'], api);
run('npm', ['run', 'prisma:seed'], api);
console.log('\nCài đặt hoàn tất. Chạy tiếp: npm run dev');
