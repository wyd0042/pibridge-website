import { readFile } from 'node:fs/promises';
export const pageFiles = ['index.html','service-vip.html','about.html','services.html','cases.html','contact.html','news.html','article-ranking.html','article-sop.html','article-visa.html'];
const sources = JSON.parse(await readFile(new URL('../assets/sources.json',import.meta.url),'utf8'));
if (sources.some(item => !item.sha256 || !item.file.startsWith('assets/img/') || item.file.includes('..'))) throw new Error('Invalid asset allowlist');
export const publicFiles = [...pageFiles,'styles.css','app.js','cases-data.js','assets/brand/wordmark.png','assets/brand/wechat-qr.png','assets/brand/favicon.svg',...sources.map(item=>item.file)];
