import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
function run(title, cmd, args) {
  const child = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: isWin });
  child.on('exit', code => {
    if (code && code !== 0) console.error(`${title} dừng với mã ${code}`);
  });
}
console.log('Khởi động API và Web...');
run('API', 'npm', ['run', 'dev:api']);
run('WEB', 'npm', ['run', 'dev:web']);
