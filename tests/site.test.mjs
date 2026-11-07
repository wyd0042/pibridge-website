import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { cases, offers, regions, normaliseRegion, selectCases } from '../cases-data.js';

const root = resolve(import.meta.dirname, '..');
const app = (await readFile(resolve(root, 'app.js'), 'utf8')).replace(/^import[^\n]+\n/, '');
async function loadPage(file = 'cases.html', search = '') {
  const html = await readFile(resolve(root, file), 'utf8');
  const dom = new JSDOM(html, { url: `https://example.test/pibridge-website/${file}${search}`, runScripts: 'outside-only' });
  const { window } = dom;
  window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new window.Event('close')); };
  window.siteData = { cases, offers, regions, normaliseRegion, selectCases };
  window.eval(`const { cases, offers, regions, normaliseRegion, selectCases } = window.siteData;\n${app}`);
  return dom;
}

test('reference density uses only marked demos and local, existing images', async () => {
  assert.equal(cases.length, 20);
  assert.equal(offers.length, 22);
  assert.equal(new Set(cases.map(item => item.id)).size, 20);
  assert.equal(new Set(offers.map(item => item.offerId)).size, 22);
  for (const item of [...cases, ...offers]) {
    assert.equal(item.demo, true);
    assert.ok(item.image.startsWith('assets/offers/'));
    await access(resolve(root, item.image));
    assert.ok(regions.some(region => region.id === item.region));
    if (item.placeholder) assert.match(item.school, /待替换/);
  }
  for (const region of regions) {
    assert.ok(selectCases(region.id).length > 0);
    assert.ok(selectCases(region.id).every(item => item.region === region.id));
  }
  assert.equal(selectCases('unrecognised').length, 20);
});

test('filters honour destination URLs, update cards and preserve Pages subpaths', async () => {
  const dom = await loadPage('cases.html', '?region=us#admissions');
  const { document } = dom.window;
  assert.equal(document.querySelectorAll('.case-card').length, selectCases('us').length);
  assert.equal(document.querySelector('[data-region="us"]').getAttribute('aria-pressed'), 'true');
  document.querySelector('[data-region="hk"]').click();
  assert.equal(document.querySelectorAll('.case-card').length, selectCases('hk').length);
  assert.match(document.querySelector('[data-result-count]').textContent, /中国香港/);
  assert.equal(dom.window.location.pathname, '/pibridge-website/cases.html');
  assert.equal(dom.window.location.search, '?region=hk');
  assert.equal(dom.window.location.hash, '#admissions');
  document.querySelector('[data-region="all"]').click();
  assert.equal(document.querySelectorAll('.case-card').length, 20);
  assert.equal(document.querySelectorAll('[data-offer-wall] .offer-card').length, 22);
  assert.equal(dom.window.location.search, '');
  dom.window.close();
});

test('case → full image → case → QR dialog keeps demo labels and restores focus', async () => {
  const dom = await loadPage();
  const { document, Event } = dom.window;
  const trigger = document.querySelector('[data-case="mit-demo"]');
  trigger.focus(); trigger.click();
  const dialog = document.querySelector('dialog');
  assert.ok(dialog.open);
  assert.match(dialog.textContent, /演示案例/);
  assert.match(dialog.textContent, /清华大学（演示背景）/);
  document.querySelector('[data-detail-offer]').click();
  assert.match(dialog.textContent, /演示案例/);
  assert.equal(document.querySelector('.modal-image').getAttribute('src'), 'assets/offers/mit-demo.jpg');
  document.querySelector('dialog [data-case]').click();
  document.querySelector('dialog [data-consult]').click();
  assert.ok(dialog.classList.contains('consult-modal'));
  assert.equal(document.querySelector('dialog img').getAttribute('src'), 'assets/brand/wechat-qr.png');
  dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, trigger);
  assert.equal(document.body.classList.contains('modal-open'), false);
  const offer = document.querySelector('[data-offer]');
  offer.click();
  dialog.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, clientX: -10, clientY: -10 }));
  assert.equal(dialog.open, false);
  dom.window.close();
});

test('mobile menu toggles, closes with Escape and closes on navigation', async () => {
  const dom = await loadPage('index.html');
  const { document, KeyboardEvent } = dom.window;
  const menuButton = document.querySelector('.menu-toggle');
  menuButton.click();
  assert.equal(menuButton.getAttribute('aria-expanded'), 'true');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(menuButton.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, menuButton);
  menuButton.click();
  document.querySelector('.main-nav a[href="index.html#services"]').addEventListener('click', event => event.preventDefault());
  document.querySelector('.main-nav a[href="index.html#services"]').click();
  assert.equal(menuButton.getAttribute('aria-expanded'), 'false');
  assert.equal(document.querySelectorAll('[data-destinations] a').length, 6);
  assert.equal(document.querySelectorAll('[data-featured] article').length, 3);
  dom.window.close();
});

test('all rendered local links, anchors and assets exist under a project subpath', async () => {
  const doms = await Promise.all(['index.html', 'cases.html'].map(file => loadPage(file)));
  const pages = new Map(doms.map(dom => [dom.window.location.pathname.split('/').at(-1), dom.window.document]));
  for (const dom of doms) {
    const document = dom.window.document;
    assert.equal(document.documentElement.lang, 'zh-CN');
    assert.equal(document.querySelectorAll('h1').length, 1);
    for (const node of document.querySelectorAll('[href], [src]')) {
      const raw = node.getAttribute('href') ?? node.getAttribute('src');
      assert.ok(!raw.startsWith('/'), `root-relative path: ${raw}`);
      const url = new URL(raw, dom.window.location.href);
      assert.ok(url.pathname.startsWith('/pibridge-website/'));
      const path = decodeURIComponent(url.pathname.replace('/pibridge-website/', ''));
      await access(resolve(root, path));
      if (url.hash && pages.has(path)) assert.ok(pages.get(path).getElementById(url.hash.slice(1)), `missing anchor: ${raw}`);
    }
  }
  doms.forEach(dom => dom.window.close());
});
