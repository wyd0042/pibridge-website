import { cases, offers, regions, normaliseRegion, selectCases } from './cases-data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const page = document.body.dataset.page;
const regionName = id => regions.find(region => region.id === id)?.name ?? '目的地待补充';
const label = item => item.demo ? '演示案例' : '申请案例';
const tags = item => `<div class="tags">${item.tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div>`;

$('[data-site-header]').innerHTML = `<header class="header"><div class="container nav-row">
  <a class="brand" href="index.html" aria-label="PiBridge 留学工作室首页"><img src="assets/brand/logo.png" width="645" height="155" alt="PiBridge 留学工作室"></a>
  <button class="menu-toggle" aria-expanded="false" aria-controls="main-navigation" aria-label="打开导航菜单"><span></span><span></span><span></span></button>
  <nav class="main-nav" id="main-navigation" aria-label="主导航">
    <a href="index.html" ${page === 'home' ? 'class="active" aria-current="page"' : ''}>首页</a>
    <a href="index.html#services">服务介绍</a><a href="index.html#process">申请流程</a>
    <a href="cases.html#admissions" ${page === 'cases' ? 'class="active" aria-current="page"' : ''}>申请案例</a>
    <a href="cases.html#offers">Offer 墙</a><button class="button nav-consult" data-consult>微信咨询 <span aria-hidden="true">↗</span></button>
  </nav></div></header>`;
$('[data-consult-section]').innerHTML = `<section class="consult-section dark-section" id="contact"><div class="container consult-layout"><div class="consult-copy"><span class="eyebrow">LET’S PLAN YOUR FUTURE TOGETHER</span><h2>你的下一程，我们一起规划。</h2><p>带上你的想法与问题，从一次认真沟通开始。</p><button class="button" data-consult>联系 PiBridge <span aria-hidden="true">↗</span></button></div><div class="consult-qr"><img src="assets/brand/wechat-qr.png" width="330" height="330" alt="PiBridge 官方微信客服二维码，扫码咨询" loading="lazy"><span>扫码添加官方微信客服</span></div></div></section>`;
$('[data-site-footer]').innerHTML = `<footer class="footer"><div class="container"><div class="footer-grid"><div class="footer-brand"><a href="index.html"><img src="assets/brand/logo.png" width="645" height="155" alt="PiBridge 留学工作室" loading="lazy"></a><p>面向中国学生的硕士申请咨询、申请协作与合作资源对接。</p></div><div><h3>探索 PiBridge</h3><ul><li><a href="index.html#services">服务介绍</a></li><li><a href="index.html#process">申请流程</a></li><li><a href="cases.html#admissions">申请案例</a></li><li><a href="cases.html#offers">Offer 墙</a></li></ul></div><div><h3>开启下一程</h3><ul><li><a href="index.html#destinations">探索申请目的地</a></li><li><button data-consult>微信咨询</button></li><li><a href="assets/brand/wechat-qr.png" target="_blank" rel="noopener">查看客服二维码 ↗</a></li></ul></div><div><h3>连接更大的世界</h3><p class="footer-tagline">CONNECT GLOBAL<br>OPPORTUNITIES</p><p class="footer-tagline">跨越边界，连接世界</p></div></div><div class="copyright">© ${new Date().getFullYear()} PiBridge 留学工作室<span>网站视觉样稿 · 案例为演示材料及待替换展示位</span></div></div></footer>`;

function offerCard(item) {
  return `<button class="offer-card" data-offer="${escape(item.offerId)}" aria-label="查看${escape(label(item))}大图：${escape(item.school)}"><span class="offer-image"><img src="${escape(item.image)}" alt="${escape(label(item))}：${escape(item.school)}，${escape(item.programme)}" loading="lazy"><span class="demo-badge">${escape(label(item))}${item.placeholder ? ' · 待替换' : ''}</span></span><span class="offer-caption"><strong>${escape(item.school)}</strong><small>${escape(item.programme)}</small></span></button>`;
}
function caseCard(item) {
  return `<article class="case-card"><div class="case-side"><img src="${escape(item.image)}" alt="${escape(label(item))} Offer 缩略图" loading="lazy"><span>${escape(label(item))}</span></div><div class="case-body"><small>${escape(regionName(item.region))} · ${escape(label(item))}</small><h3>${escape(item.school)}</h3><p class="programme">${escape(item.programme)}</p><p class="background">${escape(item.background)}</p>${tags(item)}<button class="text-link" data-case="${escape(item.id)}">查看背景与 Offer <span aria-hidden="true">→</span></button></div></article>`;
}

if (page === 'home') {
  $('[data-featured]').innerHTML = cases.slice(0, 3).map(item => `<article class="featured-card"><div class="featured-image"><img src="${escape(item.image)}" alt="${escape(label(item))}：${escape(item.school)}" loading="lazy"><span class="demo-badge">${escape(label(item))}${item.placeholder ? ' · 待替换' : ''}</span></div><div class="featured-body"><span class="eyebrow">${escape(regionName(item.region))} · MASTER’S APPLICATION</span><h3>${escape(item.school)}</h3><p>${escape(item.programme)}</p>${tags(item)}<p>${escape(item.background)}</p><button class="text-link" data-case="${escape(item.id)}">查看案例详情 <span aria-hidden="true">→</span></button></div></article>`).join('');
  $('[data-destinations]').innerHTML = regions.map(region => `<a class="destination-link" href="cases.html?region=${region.id}#admissions"><span class="destination-code">${region.code}</span><h3>${region.name}</h3><small>${region.english}</small><span aria-hidden="true">↗</span></a>`).join('');
  $('[data-offer-preview]').innerHTML = offers.slice(0, 6).map(offerCard).join('');
}
let selectedRegion = normaliseRegion(new URLSearchParams(location.search).get('region'));
function renderCases() {
  const selected = selectCases(selectedRegion);
  $('[data-cases]').innerHTML = selected.map(caseCard).join('');
  $('[data-result-count]').textContent = `${selectedRegion === 'all' ? '全部目的地' : regionName(selectedRegion)} · ${selected.length} 个展示位`;
  $('[data-empty]').hidden = selected.length > 0;
  document.querySelectorAll('[data-region]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.region === selectedRegion)));
}
if (page === 'cases') {
  $('[data-region-filters]').innerHTML = [{ id: 'all', name: '全部' }, ...regions].map(region => `<button class="filter-chip" data-region="${region.id}" aria-pressed="false">${region.name}</button>`).join('');
  renderCases();
  $('[data-offer-wall]').innerHTML = offers.map(offerCard).join('');
}

const modal = document.createElement('dialog');
modal.className = 'modal';
modal.setAttribute('aria-labelledby', 'modal-title');
modal.innerHTML = '<div class="modal-header"><h2 id="modal-title"></h2><button class="close-button" data-close-modal aria-label="关闭弹窗">×</button></div><div class="modal-content"></div>';
document.body.append(modal);
let modalTrigger = null;
function openModal(title, content, kind = '') {
  if (!modal.open) modalTrigger = document.activeElement;
  modal.className = `modal ${kind}`.trim();
  $('#modal-title').textContent = title;
  $('.modal-content', modal).innerHTML = content;
  $('.modal-content', modal).scrollTop = 0;
  if (!modal.open) modal.showModal();
  document.body.classList.add('modal-open');
  $('[data-close-modal]', modal).focus();
}
function closeModal() { modal.close(); }
modal.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  if (modalTrigger?.isConnected) modalTrigger.focus();
});
modal.addEventListener('cancel', event => { event.preventDefault(); closeModal(); });
modal.addEventListener('click', event => {
  if (event.target !== modal) return;
  const box = modal.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeModal();
});
function showOffer(item, backToCase = false) {
  openModal(`${label(item)} · ${item.school}`, `<div class="modal-notice">${item.demo ? '<strong>演示案例</strong> · 仅用于页面展示，不代表真实服务业绩。' : '经授权展示的申请材料。'}${item.placeholder ? ' 案例展示位／待替换。' : ''}${item.id === 'mit-demo' ? ' 原图脱敏和水印保持不变。' : ''} 图片按完整比例显示，可上下滚动阅读。</div>${backToCase ? `<p style="margin-bottom:15px"><button class="text-link" data-case="${escape(item.id)}">← 返回案例详情</button></p>` : ''}<img class="modal-image" src="${escape(item.image)}" alt="${escape(label(item))}完整图片：${escape(item.school)}">`);
}
function showCase(item) {
  openModal(`${label(item)} · 案例详情`, `<div class="modal-notice">${item.demo ? '<strong>演示案例</strong> · 当前资料仅用于样稿展示，不代表 PiBridge 真实服务或录取结果。' : '经授权展示的申请案例。'}</div><div class="detail-layout"><div><span class="eyebrow">${escape(regionName(item.region))} · ${escape(label(item))}</span><h3>${escape(item.school)}</h3><p>${escape(item.programme)}</p><p>${escape(item.background)}</p>${tags(item)}<p>${escape(item.summary)}</p><button class="button" data-consult>微信咨询 <span aria-hidden="true">↗</span></button></div><button class="detail-image" data-detail-offer="${escape(item.id)}"><img src="${escape(item.image)}" alt="${escape(label(item))} Offer：${escape(item.school)}"><span>${escape(label(item))} · 点击查看完整大图 ↗</span></button></div>`);
}
function showConsult() {
  openModal('微信咨询 · PiBridge', '<img src="assets/brand/wechat-qr.png" width="330" height="330" alt="PiBridge 官方微信客服二维码"><h3>下一程，与你一起规划</h3><p>使用微信扫一扫，或保存二维码后在微信中识别。</p><p><a class="text-link" href="assets/brand/wechat-qr.png" target="_blank" rel="noopener">打开二维码原图 ↗</a></p><small>PiBridge 留学工作室 · 官方微信客服</small>', 'consult-modal');
}

const menuButton = $('.menu-toggle');
const menu = $('.main-nav');
function closeMenu() { menu.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', '打开导航菜单'); }
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menu.classList.toggle('is-open', expanded);
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? '关闭导航菜单' : '打开导航菜单');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); }
});
document.addEventListener('click', event => {
  const target = event.target.closest('button, a');
  if (!target) return;
  if (menu.contains(target) && target.matches('a, [data-consult]')) closeMenu();
  if (target.matches('[data-close-modal]')) closeModal();
  else if (target.matches('[data-consult]')) showConsult();
  else if (target.matches('[data-case]')) { const item = cases.find(item => item.id === target.dataset.case); if (item) showCase(item); }
  else if (target.matches('[data-offer]')) { const item = offers.find(item => item.offerId === target.dataset.offer); if (item) showOffer(item); }
  else if (target.matches('[data-detail-offer]')) { const item = cases.find(item => item.id === target.dataset.detailOffer); if (item) showOffer(item, true); }
  else if (target.matches('[data-region], [data-reset-filters]')) {
    selectedRegion = normaliseRegion(target.dataset.region);
    const url = new URL(location.href);
    if (selectedRegion === 'all') url.searchParams.delete('region'); else url.searchParams.set('region', selectedRegion);
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    renderCases();
  }
});
window.addEventListener('popstate', () => {
  if (page !== 'cases') return;
  selectedRegion = normaliseRegion(new URLSearchParams(location.search).get('region'));
  renderCases();
});
