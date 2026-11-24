import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {renderPages} from '../scripts/render-pages.mjs';
import {pageFiles,publicFiles} from '../scripts/public-files.mjs';
import manifest from '../assets/published-offers.json' with {type:'json'};
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
  assert.doesNotMatch(rendered[file],/原站演示|学生原院校|哥伦比亚大学|南洋理工大学/);
  dom.window.close();
 }
});
test('internal routes, section links and assets remain valid under a subpath',async()=>{
 const docs=new Map(pageFiles.map(file=>[file,new JSDOM(rendered[file]).window.document]));
 assert.equal(new Set(publicFiles).size,publicFiles.length);
 assert.ok(!publicFiles.some(p=>p.startsWith('assets/img/offers/')||p.endsWith('.png')&&p.includes('published-offers/')));
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
test('new batch has exactly twelve documents grouped by four requested schools',async()=>{
 const expected=[['牛津大学',2],['帝国理工学院',1],['伦敦政治经济学院',4],['伦敦大学学院',5]];
 assert.equal(manifest.length,12);
 const doc=new JSDOM(rendered['cases.html']).window.document;
 const groups=[...doc.querySelectorAll('.offer-school-group')];
 assert.deepEqual(groups.map(g=>[g.querySelector('h3').textContent,g.querySelectorAll('.published-offer').length]),expected);
 assert.deepEqual([...doc.querySelectorAll('.published-offer')].map(c=>c.dataset.publishedOffer),manifest.map(o=>o.image));
 assert.equal(doc.querySelectorAll('.university-table tbody tr').length,4);
 assert.equal(doc.querySelectorAll('.university-table tbody a').length,12);
 assert.equal(new Set(manifest.map(o=>o.image)).size,12);
 for(const offer of manifest){
  assert.ok(!offer.originalSchool&&!offer.originalProgramme&&!offer.date);
  assert.equal(createHash('sha256').update(await readFile(resolve(root,offer.image))).digest('hex'),offer.sha256);
 }
 assert.equal((await readdir(resolve(root,'assets/img/offers')).catch(error=>error.code==='ENOENT'?[]:Promise.reject(error))).length,0);
 const directory=await readdir(resolve(root,'assets/img/published-offers'));
 assert.equal(directory.length,12);
 doc.defaultView.close();
});
test('offer gallery opens original image, navigates, wraps and restores focus',async()=>{
 const dom=await loadPage(),w=dom.window,doc=w.document;
 const links=[...doc.querySelectorAll('[data-published-offer]')],dialog=doc.querySelector('.lightbox');
 links[0].focus(); links[0].click();
 assert.ok(dialog.open); assert.equal(dialog.querySelector('img').getAttribute('src'),manifest[0].image);
 doc.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
 assert.equal(dialog.querySelector('img').getAttribute('src'),manifest.at(-1).image);
 dialog.querySelector('[data-gallery-step="1"]').click();
 assert.equal(dialog.querySelector('img').getAttribute('src'),manifest[0].image);
 dialog.dispatchEvent(new w.Event('cancel',{cancelable:true}));
 assert.ok(!dialog.open); assert.equal(doc.activeElement,links[0]);
 for(const link of links){link.click();assert.equal(dialog.querySelector('img').getAttribute('src'),link.getAttribute('href'));dialog.querySelector('[data-close-dialog]').click();}
 dom.window.close();
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
