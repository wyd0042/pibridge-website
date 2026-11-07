import { mkdir, rm, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const publicFiles = [
  'index.html', 'cases.html', 'styles.css', 'app.js', 'cases-data.js',
  'assets/brand/logo.png', 'assets/brand/wechat-qr.png', 'assets/brand/favicon.svg',
  'assets/offers/demo-offer.png', 'assets/offers/mit-demo.jpg', 'assets/offers/placeholder.svg'
];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await rm(resolve(root, 'dist'), { recursive: true, force: true });
for (const file of publicFiles) {
  const target = resolve(root, 'dist', file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, file), target);
}
console.log(`Built ${publicFiles.length} allowlisted public files in dist/.`);
