import { mkdir, rm, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import publishedOffers from '../assets/published-offers.json' with { type: 'json' };
import { publicFiles } from './public-files.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await rm(resolve(root,'dist'),{recursive:true,force:true});
for(const file of publicFiles) {
  const target=resolve(root,'dist',file);
  await mkdir(dirname(target),{recursive:true});
  await copyFile(resolve(root,file),target);
}
const offerImages = [...new Set(publishedOffers.map(({ image }) => image))];
for (const image of offerImages) {
  const filename = image.split('/').at(-1).replace(/\.(?:png|jpe?g)$/i, '.webp');
  const target = resolve(root, 'dist/assets/img/published-offers/thumbs', filename);
  await mkdir(dirname(target), { recursive: true });
  await sharp(resolve(root, image))
    .rotate()
    .resize({ width: 720, height: 900, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(target);
}
console.log('Built ' + publicFiles.length + ' allowlisted public files and ' + offerImages.length + ' optimized Offer thumbnails.');
