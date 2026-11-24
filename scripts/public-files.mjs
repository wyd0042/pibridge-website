import publishedOffers from '../assets/published-offers.json' with { type: 'json' };
import { readFile } from 'node:fs/promises';
export const pageFiles = ['index.html','service-vip.html','about.html','services.html','cases.html','contact.html'];
const sources = JSON.parse(await readFile(new URL('../assets/sources.json',import.meta.url),'utf8'));
if (sources.some(item => !item.sha256 || !item.file.startsWith('assets/img/') || item.file.includes('..'))) throw new Error('Invalid asset allowlist');
const publishedImages = publishedOffers.map(({ image }) => image);
if (publishedImages.some(image => !/^assets\/img\/published-offers\/[a-z0-9-]+\.(?:png|jpg)$/.test(image))) {
  throw new Error('Invalid published offer asset');
}
export const publicFiles = [...pageFiles,'styles.css','app.js','assets/brand/wordmark.png','assets/brand/wechat-qr.png','assets/brand/favicon.svg','mockup/index.html','mockup/workbench.js',...sources.map(item=>item.file),...publishedImages];
