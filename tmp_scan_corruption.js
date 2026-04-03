
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const appsDir = path.join(rootDir, 'apps');

const mojibakePatterns = [
    'Ãƒ', // Triple/Double encoded
    'Ã³', 'Ãª', 'Ä‘', 'á»', 'áº', 'Ã¡', 'Ã ', 'Ã¢', 'Ã£', 'Ã¨', 'Ã©', 'Ã¬', 'Ã­', 'Ã²', 'Ã´', 'Ãµ', 'Ã¹', 'Ãº', 'Ã½',
    'CÆ¡', 'Ä‘á»™ng', 'chuyá»ƒn'
];

function isCorrupted(content) {
    return mojibakePatterns.some(p => content.includes(p));
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                scanDir(fullPath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (isCorrupted(content)) {
                console.log(fullPath);
            }
        }
    }
}

console.log('Scanning for corrupted files...');
scanDir(appsDir);
scanDir(path.join(rootDir, 'scripts'));
