import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { cases, offers, normaliseRegion, normaliseDegree, selectCases } from '../cases-data.js';
import { renderPages } from '../scripts/render-pages.mjs';
import { pageFiles, publicFiles } from '../scripts/public-files.mjs';

const root=resolve(import.meta.dirname,'..');
const app=(await readFile(resolve(root,'app.js'),'utf8')).replace(/^import[^\n]+\n/,'');
const rendered=renderPages();
async function loadPage(file='cases.html',search='') {
  const html=await readFile(resolve(root,file),'utf8');
  const dom=new JSDOM(html,{url:`https://example.test/pibridge-website/${file}${search}`,runScripts:'outside-only'});
  const {window}=dom;
  window.matchMedia=()=>({matches:true});
  window.scrollTo=()=>{};
  window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
  window.siteData={cases,offers,normaliseRegion,normaliseDegree,selectCases};
  window.eval(`const {cases,offers,normaliseRegion,normaliseDegree,selectCases}=window.siteData;\n${app}`);
  return dom;
}
function visibleCards(document){return [...document.querySelectorAll('.case-tile')].filter(card=>!card.hidden);}

test('all 10 generated pages keep complete sections and PiBridge brand',async()=>{
  const counts={'index.html':13,'service-vip.html':7,'about.html':7,'services.html':4,'cases.html':6,'contact.html':4,'news.html':2,'article-ranking.html':3,'article-sop.html':3,'article-visa.html':3};
  assert.equal(pageFiles.length,10);
  for(const file of pageFiles){
    const source=await readFile(resolve(root,file),'utf8');
    assert.equal(source,rendered[file],`${file} must be regenerated`);
    assert.doesNotMatch(source,/留学工作室|星之辰|13932128594|xzc67846283|mailto:|tel:|渝ICP备|xzcgoaboard/);
    const dom=await loadPage(file),doc=dom.window.document;
    assert.equal(doc.querySelectorAll('main section').length,counts[file],file);
    assert.equal(doc.querySelectorAll('h1').length,1,file);
    assert.equal(doc.querySelector('.brand img').getAttribute('src'),'assets/brand/wordmark.png');
    assert.match(doc.querySelector('.brand').textContent,/派桥留学/);
    assert.match(doc.querySelector('.prototype-note').textContent,/仅作演示/);
    dom.window.close();
  }
});

test('all internal routes, anchors and public images work under the Pages subpath',async()=>{
  const documents=new Map();
  for(const file of pageFiles) documents.set(file,new JSDOM(rendered[file]).window.document);
  for(const [file,doc] of documents){
    for(const node of doc.querySelectorAll('[src],[href]')){
      const raw=node.getAttribute('href')??node.getAttribute('src');
      if(raw.startsWith('https://xzcoffer.cn/')) continue;
      assert.ok(!raw.startsWith('/'),`${file}: ${raw}`);
      const url=new URL(raw,`https://example.test/pibridge-website/${file}`);
      assert.equal(url.origin,'https://example.test');
      assert.ok(url.pathname.startsWith('/pibridge-website/'));
      const path=decodeURIComponent(url.pathname.slice('/pibridge-website/'.length));
      assert.ok(publicFiles.includes(path),`${file}: ${path} missing from allowlist`);
      await access(resolve(root,path));
      if(url.hash&&documents.has(path)) assert.ok(documents.get(path).getElementById(url.hash.slice(1)),`${file}: missing ${raw}`);
    }
  }
  const css=await readFile(resolve(root,'styles.css'),'utf8');
  for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)\s*['"]?\)/g)){
    assert.ok(publicFiles.includes(match[1]));
    await access(resolve(root,match[1]));
  }
  assert.match(css,/\.brand img\s*\{[^}]*height:auto/);
  for(const [file,html] of Object.entries(rendered)) for(const match of html.matchAll(/url\('([^']+)'\)/g)) assert.ok(publicFiles.includes(match[1]),`${file}: background missing`);
});

test('reference content remains marked, with 20 cases and 22 intact original images',async()=>{
  assert.equal(cases.length,20);assert.equal(offers.length,22);
  assert.ok(cases.every(item=>item.demo&&item.source.startsWith('https://xzcoffer.cn/')));
  const sources=JSON.parse(await readFile(resolve(root,'assets/sources.json'),'utf8'));
  for(const asset of sources){
    const bytes=await readFile(resolve(root,asset.file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.file);
  }
  assert.equal(new Set(publicFiles).size,publicFiles.length);
  assert.ok(!publicFiles.some(file=>/sources\.json|mockup|reference\/|tests\/|README|scripts\/|node_modules/.test(file)));
});

test('region and degree combine, invalid queries reset, and empty results can reset',async()=>{
  const dom=await loadPage('cases.html','?region=us&degree=phd#admissions'),doc=dom.window.document;
  assert.equal(visibleCards(doc).length,selectCases('us','phd').length);
  doc.querySelector('[data-filter="region"][data-value="ca"]').click();
  assert.equal(visibleCards(doc).length,0);assert.equal(doc.querySelector('[data-empty]').hidden,false);
  doc.querySelector('[data-reset-filters]').click();
  assert.equal(visibleCards(doc).length,20);
  assert.equal(dom.window.location.pathname,'/pibridge-website/cases.html');
  assert.equal(dom.window.location.hash,'#admissions');assert.equal(dom.window.location.search,'');
  dom.window.close();
  const invalid=await loadPage('cases.html','?region=bad&degree=wrong');
  assert.equal(visibleCards(invalid.window.document).length,20);invalid.window.close();
});

test('case deep links, nested gallery, arrows, Escape and focus restoration work',async()=>{
  const dom=await loadPage(),{document:doc,Event,KeyboardEvent}=dom.window;
  const trigger=doc.querySelector('[data-case="case-1"]');trigger.focus();trigger.click();
  const drawer=doc.querySelector('.drawer');assert.ok(drawer.open);assert.equal(dom.window.location.hash,'#case-1');
  assert.match(drawer.textContent,/不代表派桥/);
  const offerButton=drawer.querySelector('[data-offer]');offerButton.focus();offerButton.click();
  const lightbox=doc.querySelector('.lightbox');assert.ok(lightbox.open);assert.ok(drawer.open);
  const first=lightbox.querySelector('img').src;
  doc.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  assert.notEqual(lightbox.querySelector('img').src,first);
  assert.match(lightbox.textContent,/原站演示/);
  lightbox.dispatchEvent(new Event('cancel',{cancelable:true}));
  assert.equal(lightbox.open,false);assert.equal(doc.activeElement,offerButton);assert.ok(doc.body.classList.contains('modal-open'));
  drawer.querySelector('[data-close-dialog]').click();
  assert.equal(drawer.open,false);assert.equal(doc.activeElement,trigger);assert.equal(dom.window.location.hash,'#admissions');
  assert.equal(doc.body.classList.contains('modal-open'),false);dom.window.close();
  const deep=await loadPage('cases.html','#case-16');assert.ok(deep.window.document.querySelector('.drawer').open);assert.equal(deep.window.document.querySelectorAll('.drawer [data-offer]').length,2);deep.window.close();
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

test('mobile navigation, Escape, dropdown targets and compact header work',async()=>{
  const dom=await loadPage('about.html'),{document:doc,KeyboardEvent,Event}=dom.window;
  doc.querySelector('.menu-toggle').click();assert.ok(doc.body.classList.contains('menu-open'));
  assert.equal(doc.querySelector('.offcanvas-menu').inert,false);
  doc.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(doc.querySelector('.menu-toggle').getAttribute('aria-expanded'),'false');
  doc.querySelector('.menu-toggle').click();doc.querySelector('.menu-overlay').click();assert.equal(doc.body.classList.contains('menu-open'),false);
  Object.defineProperty(dom.window,'scrollY',{value:650,configurable:true});dom.window.dispatchEvent(new Event('scroll'));
  assert.ok(doc.querySelector('.header').classList.contains('is-compact'));assert.ok(doc.querySelector('[data-header-spacer]').style.height);
  dom.window.close();
});

test('ranking sorts in both directions and demo forms never send or store data',async()=>{
  const dom=await loadPage(),doc=dom.window.document;
  const sort=doc.querySelector('[data-sort-rank]');sort.click();
  let ranks=[...doc.querySelectorAll('tbody tr')].map(row=>Number(row.dataset.rank));assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));
  sort.click();ranks=[...doc.querySelectorAll('tbody tr')].map(row=>Number(row.dataset.rank));assert.deepEqual(ranks,[...ranks].sort((a,b)=>b-a));dom.window.close();
  const contact=await loadPage('contact.html'),d=contact.window.document;
  let network=0;contact.window.fetch=()=>{network++;};
  const form=d.querySelector('.evaluation-form');form.querySelector('[name="name"]').value='演示';form.querySelector('[name="phone"]').value='12345678';form.querySelector('[type="checkbox"]').checked=true;
  form.dispatchEvent(new contact.window.Event('submit',{bubbles:true,cancelable:true}));
  assert.ok(d.querySelector('.consult-modal').open);assert.match(form.querySelector('.form-status').textContent,/未发送或保存/);assert.equal(form.querySelector('[name="name"]').value,'');
  assert.equal(contact.window.localStorage.length,0);assert.equal(contact.window.sessionStorage.length,0);assert.equal(network,0);
  const subscribe=d.querySelector('.subscribe-form');subscribe.querySelector('input').value='demo@example.test';subscribe.dispatchEvent(new contact.window.Event('submit',{bubbles:true,cancelable:true}));assert.match(subscribe.textContent,/未发送或保存/);
  assert.doesNotMatch(app,/\bfetch\(|XMLHttpRequest|sendBeacon|mailto:|localStorage\.|sessionStorage\./);
  contact.window.close();
});
