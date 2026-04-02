import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const api = path.join(root, 'apps', 'api');
const isWin = process.platform === 'win32';

function runSync(cmd, args, cwd = root, optional = false) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin });
  if (!optional && result.status !== 0) process.exit(result.status ?? 1);
}

function runAsync(title, cmd, args, cwd = root) {
  const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: isWin });
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`${title} exited with code ${code}`);
  });
}

runSync('docker', ['compose', 'up', '-d'], root, true);
runSync('npx', ['prisma', 'generate'], api, true);
runSync('npx', ['prisma', 'db', 'push'], api, true);
runSync('npm', ['run', 'prisma:seed'], api, true);
console.log('Khoi dong API va Web...');
runAsync('API', 'npm', ['run', 'dev:api']);
runAsync('WEB', 'npm', ['run', 'dev:web']);
