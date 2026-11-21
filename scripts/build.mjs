import { mkdir, rm, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicFiles } from './public-files.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await rm(resolve(root,'dist'),{recursive:true,force:true});
for(const file of publicFiles) {
  const target=resolve(root,'dist',file);
  await mkdir(dirname(target),{recursive:true});
  await copyFile(resolve(root,file),target);
}
console.log(`Built ${publicFiles.length} allowlisted public files.`);
