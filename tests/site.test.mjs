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

test('published offers link to reviewed first-page PNGs and keep reference examples separate',async()=>{
  const document = new JSDOM(rendered['cases.html']).window.document;
  const manifest = JSON.parse(await readFile(resolve(root,'assets/published-offers.json'),'utf8'));
  const cards = [...document.querySelectorAll('#offers .published-offer')];
  assert.equal(cards.length,manifest.length);
  assert.ok(cards.length > 0);
  assert.equal(document.querySelectorAll('#offers .reference-offers [data-offer]').length,offers.length);
  const offersByImage = new Map(manifest.map(offer => [offer.image, offer]));
  const tiers = [
    ['哥伦比亚大学'],
    ['牛津大学','伦敦政治经济学院'],
    ['香港大学','香港中文大学','香港科技大学','南洋理工大学'],
    ['伦敦大学学院'],
  ];
  const tierOf = school => {
    const index = tiers.findIndex(tier => tier.includes(school));
    return index < 0 ? tiers.length : index;
  };
  const ordered = cards.map(card => offersByImage.get(card.getAttribute('href')));
  assert.equal(new Set(ordered).size, manifest.length);
  for (let index = 1; index < ordered.length; index++) {
    const previous = ordered[index - 1], current = ordered[index];
    assert.ok(tierOf(previous.school) <= tierOf(current.school));
    if (tierOf(previous.school) === tierOf(current.school)) {
      assert.ok((previous.date ?? '') >= (current.date ?? ''), current.programme);
    }
  }
  for (const card of cards) {
    const {image, school, programme, date} = offersByImage.get(card.getAttribute('href'));
    assert.equal(card.getAttribute('href'),image);
    assert.equal(card.querySelector('img').getAttribute('src'),image);
    assert.ok(card.textContent.includes(school) && card.textContent.includes(programme));
    assert.equal(card.querySelector('time')?.dateTime,date ?? undefined);
    const bytes = await readFile(resolve(root,image));
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  }
  const backgrounds = [...document.querySelectorAll('#admissions article')];
  const verified = manifest.filter(offer => offer.originalSchool);
  assert.equal(backgrounds.length,verified.length);
  assert.equal(document.querySelectorAll('#admissions .case-tile').length,0);
  for (const card of backgrounds) {
    const matchingOffer = document.querySelector(card.querySelector('a').hash);
    const details = offersByImage.get(matchingOffer.getAttribute('href'));
    assert.equal(card.querySelector('h3').textContent,details.originalSchool);
    assert.ok(card.textContent.includes(details.programme));
  }
  assert.ok(!publicFiles.some(file=>file.endsWith('.pdf') || file.startsWith('offer-modify/')));
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

test('university summary lists only published documents and links to matching Offer cards',async()=>{
  const document = new JSDOM(rendered['cases.html']).window.document;
  const manifest = JSON.parse(await readFile(resolve(root,'assets/published-offers.json'),'utf8'));
  const offersByImage = new Map(manifest.map(offer => [offer.image, offer]));
  const rows = [...document.querySelectorAll('#rankings tbody tr')];
  assert.equal(rows.length,new Set(manifest.map(offer => offer.school)).size);
  const seen = new Set();
  for (const row of rows) {
    for (const link of row.querySelectorAll('a')) {
      const card = document.querySelector(link.hash);
      const offer = offersByImage.get(card?.getAttribute('href'));
      assert.equal(row.querySelector('th').textContent,offer.school);
      assert.equal(link.textContent,offer.programme);
      seen.add(offer.image);
    }
  }
  assert.equal(seen.size,manifest.length);
  assert.doesNotMatch(document.querySelector('#rankings').textContent,/QS|原站|参考案例/);
});

test('demo forms never send or store data',async()=>{
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
