import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {renderPages} from '../scripts/render-pages.mjs';
import {pageFiles,publicFiles} from '../scripts/public-files.mjs';
import manifest from '../assets/published-offers.json' with {type:'json'};
import fall2027 from '../assets/fall-2027-offers.json' with {type:'json'};
const root=resolve(import.meta.dirname,'..');
const app=await readFile(resolve(root,'app.js'),'utf8');
const rendered=renderPages();
async function loadPage(file='cases.html',search=''){
 const dom=new JSDOM(rendered[file],{url:`https://example.test/pibridge-website/${file}${search}`,runScripts:'outside-only'});
 const w=dom.window; w.matchMedia=()=>({matches:true}); w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 w.eval(app); return dom;
}
test('all six published pages match templates and keep navigation and brand',async()=>{
 assert.equal(pageFiles.length,6);
 for(const file of pageFiles){
  assert.equal(await readFile(resolve(root,file),'utf8'),rendered[file]);
  const dom=await loadPage(file),doc=dom.window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);
  assert.match(doc.querySelector('.brand').textContent,/派桥留学/);
  assert.equal(doc.querySelectorAll('main .mentor-card').length,['index.html','about.html'].includes(file)?24:0);
  assert.doesNotMatch(rendered[file],/原站演示|学生原院校/);
  dom.window.close();
 }
});
test('internal routes, section links and assets remain valid under a subpath',async()=>{
 const docs=new Map(pageFiles.map(file=>[file,new JSDOM(rendered[file]).window.document]));
 assert.equal(new Set(publicFiles).size,publicFiles.length);
 assert.ok(!publicFiles.some(p=>p.startsWith('assets/img/offers/')||p.includes('oxford-mmsc-2025.jpg')));
 for(const [file,doc] of docs) for(const node of doc.querySelectorAll('[src],[href]')){
  const raw=node.getAttribute('href')??node.getAttribute('src'); assert.ok(!raw.startsWith('/'));
  const url=new URL(raw,`https://example.test/pibridge-website/${file}`);
  assert.equal(url.origin,'https://example.test');
  const path=decodeURIComponent(url.pathname.slice('/pibridge-website/'.length));
  assert.ok(publicFiles.includes(path),`${file}: ${path}`); await access(resolve(root,path));
  if(url.hash&&docs.has(path))assert.ok(docs.get(path).getElementById(url.hash.slice(1)),`${file}: ${raw}`);
 }
 for(const file of publicFiles)await access(resolve(root,file));
 for(const doc of docs.values())doc.defaultView.close();
});
test('all offers follow the curated order without school sections or image links',async()=>{
 assert.equal(manifest.length,51);
 const cuhkStart=manifest.findIndex(o=>o.school==='香港中文大学');
 assert.deepEqual(manifest.slice(cuhkStart,cuhkStart+5).map(o=>o.school),['香港中文大学','香港中文大学','香港中文大学','香港理工大学','香港理工大学']);
 assert.equal(manifest[cuhkStart+2].programme,'MSc Risk Management Science and Data Analytics');
 assert.deepEqual(manifest.slice(-6).map(o=>o.school),['南洋理工大学','南洋理工大学','南洋理工大学','南洋理工大学','新加坡国立大学','新加坡国立大学']);
 assert.equal(new Set(manifest.map(o=>o.image)).size,51);
 assert.deepEqual(manifest.slice(0,5).map(o=>o.school),['牛津大学','剑桥大学','牛津大学','牛津大学','帝国理工学院']);
 assert.ok(manifest.slice(5,9).every(o=>o.school==='伦敦政治经济学院'));
 assert.equal(manifest[9].school,'加州大学伯克利分校');
 assert.ok(manifest.slice(10,12).every(o=>o.school==='哥伦比亚大学'));
 assert.ok(manifest.slice(12,17).every(o=>o.school==='伦敦大学学院'));
 assert.deepEqual(manifest.filter(o=>o.school==='杜克大学').map(o=>o.status),['奖学金通知','奖学金通知']);
 for(const offer of manifest){
  assert.match(offer.image,/-pibridge\.png$/);
  assert.equal(offer.watermark?.text,'PiBridge');
  assert.equal(offer.watermark?.rows,3);
  assert.match(offer.sourceSha256,/^[a-f0-9]{64}$/);
 }
 for(const page of ['index.html','cases.html']){
  const doc=new JSDOM(rendered[page]).window.document;
  const cards=[...doc.querySelectorAll('main .published-offer')];
  assert.equal(doc.querySelectorAll('.offer-grid').length,1);
  assert.equal(doc.querySelectorAll('.published-offer small').length,0);
  assert.doesNotMatch(cards.map(c=>c.textContent).join(' '),/有条件录取|20\d\d\/\d\d 学年/);
  assert.equal(doc.querySelectorAll('.offer-school-group,.university-table').length,0);
  assert.deepEqual(cards.map(c=>c.querySelector('img').getAttribute('src')),manifest.map(o=>o.image));
  assert.ok(cards.every(c=>c.tagName==='ARTICLE'&&!c.querySelector('a,button')));
  assert.ok(![...doc.querySelectorAll('a')].some(a=>/\.(png|jpg)$/.test(a.getAttribute('href'))&&a.getAttribute('href').includes('published-offers')));
  doc.defaultView.close();
 }
 for(const offer of manifest)assert.equal(createHash('sha256').update(await readFile(resolve(root,offer.image))).digest('hex'),offer.sha256);
 assert.equal((await readdir(resolve(root,'assets/img/published-offers'))).length,51);
 assert.equal(manifest[0].image,'assets/img/published-offers/oxford-mmsc-2025-v2-pibridge.png');
});
test('offer clicks and arrow keys cannot open an enlargement dialog',async()=>{
 for(const page of ['index.html','cases.html']){
  const dom=await loadPage(page),w=dom.window,doc=w.document;
  for(const card of doc.querySelectorAll('.published-offer')){
   card.click();card.querySelector('img').click();
   doc.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
   assert.equal(doc.querySelectorAll('dialog[open],.lightbox').length,0);
  }
  dom.window.close();
 }
});
test('forms show WeChat without network or persistence and clear fields',async()=>{
 for(const file of ['index.html','contact.html']){
  const dom=await loadPage(file),w=dom.window,doc=w.document;
  w.fetch=()=>{throw new Error('unexpected request');};
  w.XMLHttpRequest=function(){throw new Error('unexpected request');};
  for(const form of doc.querySelectorAll('[data-form="qr"]')){
   form.querySelectorAll('input:not([type="checkbox"])').forEach(input=>input.value=input.type==='email'?'test@example.com':'test');
   form.reportValidity=()=>true;
   form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
   const dialog=doc.querySelector('.consult-modal'); assert.ok(dialog.open);
   assert.equal(w.localStorage.length,0); assert.equal(w.sessionStorage.length,0);
   assert.ok([...form.querySelectorAll('input')].every(input=>!input.value));
   dialog.querySelector('[data-close-dialog]').click();
  }
  dom.window.close();
 }
});


test('slider indicators, benefit cards, pause and slide accessibility stay aligned',async()=>{
  const dom=await loadPage('index.html'),doc=dom.window.document;
  assert.equal(doc.querySelectorAll('.hero-slide').length,4);
  doc.querySelector('.benefit-item[data-slide-to="2"]').click();
  assert.equal(doc.querySelector('.hero-slide.active').dataset.slide,'2');
  assert.equal(doc.querySelector('.hero-dots [data-slide-to="2"]').getAttribute('aria-pressed'),'true');
  assert.equal(doc.querySelectorAll('.hero-slide[aria-hidden="false"]').length,1);
  assert.equal(doc.querySelector('[data-slide="0"]').inert,true);
  doc.querySelector('[data-slider-pause]').click();
  assert.match(doc.querySelector('[data-slider-pause]').textContent,/继续/);
  doc.querySelector('.hero-dots [data-slide-to="0"]').click();assert.equal(doc.querySelector('.hero-slide.active').dataset.slide,'0');
  dom.window.close();
});

test('four navigation links, mobile menu, Escape and compact header work',async()=>{
  const dom=await loadPage('about.html'),{document:doc,KeyboardEvent,Event}=dom.window;
  const expected = [
    ['首页','index.html'],
    ['申请服务','services.html'],
    ['录取案例','cases.html'],
    ['导师团队','about.html#faculty-team']
  ];
  for (const selector of ['.main-nav a','.offcanvas-menu nav a','.footer .two-col a']) {
    const links = [...doc.querySelectorAll(selector)];
    assert.deepEqual(links.map(link => [link.textContent,link.getAttribute('href')]),expected);
  }
  assert.equal(doc.querySelector('.main-nav [aria-current="page"]').textContent,'导师团队');
  doc.querySelector('.menu-toggle').click();assert.ok(doc.body.classList.contains('menu-open'));
  assert.equal(doc.querySelector('.offcanvas-menu').inert,false);
  doc.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(doc.querySelector('.menu-toggle').getAttribute('aria-expanded'),'false');
  doc.querySelector('.menu-toggle').click();doc.querySelector('.menu-overlay').click();assert.equal(doc.body.classList.contains('menu-open'),false);
  Object.defineProperty(dom.window,'scrollY',{value:650,configurable:true});dom.window.dispatchEvent(new Event('scroll'));
  assert.ok(doc.querySelector('.header').classList.contains('is-compact'));assert.ok(doc.querySelector('[data-header-spacer]').style.height);
  dom.window.close();
});

test('27 Fall lists all twenty text-only results with recommendations identified',()=>{
 assert.equal(fall2027.length,20);
 assert.equal(fall2027.filter(o=>o.status==='推研').length,3);
 for(const page of ['index.html','cases.html']){
  const doc=new JSDOM(rendered[page]).window.document;
  const section=doc.getElementById('fall-2027-offers');
  assert.ok(section);
  assert.equal(section.querySelectorAll('li').length,20);
  assert.equal(section.querySelectorAll('img,a,button').length,0);
  assert.equal((section.textContent.match(/（推研）/g)||[]).length,3);
  assert.doesNotMatch(section.textContent,/CJH|MZY|LYD|DXK|CSQ|ZX/);
  assert.deepEqual([...section.querySelectorAll('li strong')].map(n=>n.textContent),fall2027.map(o=>o.school));
  doc.defaultView.close();
 }
});
