// ينسخ pdf.worker من pdfjs-dist إلى public/ بامتداد .js (يتجنب مشاكل MIME لـ .mjs في WebView)
// ويبقيه خارج webpack/SWC الذي يفشل في تحليل الملف أثناء next build.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const candidates = [
  'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  'node_modules/pdfjs-dist/build/pdf.worker.min.js',
];
const src = candidates.map((c) => resolve(root, c)).find((c) => existsSync(c));

if (!src) {
  console.error('pdfjs-dist worker not found. Run "npm install" first.');
  process.exit(1);
}

mkdirSync(resolve(root, 'public'), { recursive: true });
copyFileSync(src, resolve(root, 'public/pdf.worker.min.js'));
console.log('Copied PDF worker ->', 'public/pdf.worker.min.js');
