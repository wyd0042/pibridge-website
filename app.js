import { cases, offers, normaliseRegion, normaliseDegree, selectCases } from './cases-data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const e = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const route = location.pathname.split('/').pop() || 'index.html';
const activeRoute = route.startsWith('article-') ? 'news.html' : route;
$$('.main-nav a, .offcanvas-menu nav a').forEach(link => {
  const active = link.getAttribute('href') === activeRoute;
  link.classList.toggle('active', active);
  if (active) link.setAttribute('aria-current', 'page');
});

const header = $('.header');
const spacer = $('[data-header-spacer]');
function updateHeader() {
  const compact = window.scrollY > 600;
  header.classList.toggle('is-compact', compact);
  spacer.style.height = compact ? (window.innerWidth > 991 ? '96px' : window.innerWidth > 767 ? '80px' : '72px') : '';
}
window.addEventListener('scroll', updateHeader, { passive:true });
window.addEventListener('resize', updateHeader);
updateHeader();

const menuButton = $('.menu-toggle');
const mobileMenu = $('.offcanvas-menu');
const menuOverlay = $('.menu-overlay');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  mobileMenu.inert = !open;
  menuOverlay.hidden = !open;
  if (open) $('a',mobileMenu).focus();
}
menuButton.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$$('[data-close-menu]').forEach(button => button.addEventListener('click', () => { setMenu(false); menuButton.focus(); }));
$$('a',mobileMenu).forEach(link => link.addEventListener('click', () => setMenu(false)));
window.addEventListener('resize', () => { if (window.innerWidth > 991) setMenu(false); });

const slider = $('.hero-slider');
const slides = $$('[data-slide]');
let slideIndex = 0, slideTimer = null, userPaused = false, hoverPaused = false;
function showSlide(index) {
  if (!slides.length) return;
  slideIndex = (index + slides.length) % slides.length;
  slides.forEach((slide,i) => {
    const active = i === slideIndex;
    slide.classList.toggle('active',active);
    slide.setAttribute('aria-hidden',String(!active));
    slide.inert = !active;
  });
  $$('[data-slide-to]').forEach(button => {
    const active = Number(button.dataset.slideTo) === slideIndex;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  });
}
function resetSlider() {
  clearInterval(slideTimer);
  if (slides.length > 1 && !reduceMotion && !userPaused && !hoverPaused && !document.hidden) slideTimer = setInterval(() => showSlide(slideIndex+1),6500);
}
if (slider) {
  $$('[data-slide-to]').forEach(button => button.addEventListener('click', () => { showSlide(Number(button.dataset.slideTo)); resetSlider(); }));
  $('[data-slider-pause]').addEventListener('click', event => {
    userPaused = !userPaused;
    event.currentTarget.setAttribute('aria-pressed',String(userPaused));
    event.currentTarget.textContent = userPaused ? '继续轮播' : '暂停轮播';
    resetSlider();
  });
  slider.addEventListener('mouseenter', () => { hoverPaused=true; resetSlider(); });
  slider.addEventListener('mouseleave', () => { hoverPaused=false; resetSlider(); });
  slider.addEventListener('focusin', () => { hoverPaused=true; resetSlider(); });
  slider.addEventListener('focusout', event => { if (!slider.contains(event.relatedTarget)) { hoverPaused=false; resetSlider(); } });
  let touchStart = 0;
  slider.addEventListener('touchstart', event => { touchStart=event.changedTouches[0].clientX; },{passive:true});
  slider.addEventListener('touchend', event => { const delta=event.changedTouches[0].clientX-touchStart; if(Math.abs(delta)>50) {showSlide(slideIndex+(delta<0?1:-1));resetSlider();} },{passive:true});
  document.addEventListener('visibilitychange',resetSlider);
  showSlide(0); resetSlider();
}

let selectedRegion = normaliseRegion(new URLSearchParams(location.search).get('region'));
let selectedDegree = normaliseDegree(new URLSearchParams(location.search).get('degree'));
function filterCases(updateURL = true) {
  if (!$('.case-filters')) return;
  const selected = new Set(selectCases(selectedRegion,selectedDegree).map(item=>item.id));
  $$('.case-tile').forEach(card => { card.hidden=!selected.has(card.id); });
  $$('[data-filter]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.value === (button.dataset.filter==='region'?selectedRegion:selectedDegree))));
  $('[data-result-count]').textContent = `${selected.size} 个参考演示案例`;
  $('[data-empty]').hidden = selected.size > 0;
  if (updateURL) {
    const url = new URL(location.href);
    if(selectedRegion==='all') url.searchParams.delete('region'); else url.searchParams.set('region',selectedRegion);
    if(selectedDegree==='all') url.searchParams.delete('degree'); else url.searchParams.set('degree',selectedDegree);
    history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
}
filterCases(false);

function createDialog(kind,title) {
  const dialog=document.createElement('dialog');
  dialog.className=`modal ${kind}`;
  dialog.setAttribute('aria-labelledby',`${kind}-title`);
  dialog.innerHTML=`<div class="modal-header"><h2 id="${kind}-title">${title}</h2><button class="modal-close" aria-label="关闭弹窗" data-close-dialog>×</button></div><div class="modal-content"></div>`;
  document.body.append(dialog);
  dialog.addEventListener('close', () => {
    document.body.classList.toggle('modal-open',$$('dialog[open]').length>0);
    if (dialog.trigger?.isConnected) dialog.trigger.focus();
  });
  dialog.addEventListener('cancel',event => { event.preventDefault(); closeDialog(dialog); });
  dialog.addEventListener('click',event => {
    if(event.target!==dialog) return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom) closeDialog(dialog);
  });
  return dialog;
}
const drawer=createDialog('drawer','原站演示案例详情');
const lightbox=createDialog('lightbox','原站演示 Offer');
const consult=createDialog('consult-modal','微信咨询 · PiBridge 派桥留学');
function openDialog(dialog) {
  if (!dialog.open) {
    dialog.trigger=document.activeElement;
    dialog.showModal();
  }
  document.body.classList.add('modal-open');
  $('.modal-content',dialog).scrollTop=0;
  $('[data-close-dialog]',dialog).focus();
}
function closeDialog(dialog) {
  if (dialog===drawer && /^#case-\d+$/.test(location.hash)) history.replaceState(null,'',location.pathname+location.search+'#admissions');
  dialog.close();
}
function showConsult() {
  $('.modal-content',consult).innerHTML='<img src="assets/brand/wechat-qr.png" width="330" height="330" alt="PiBridge 派桥留学官方微信客服二维码"><h3>PiBridge 派桥留学</h3><p>使用微信扫一扫，或保存二维码后在微信中识别。</p><p>表单演示不发送或保存个人资料。</p><a href="assets/brand/wechat-qr.png" target="_blank" rel="noopener">打开二维码原图 ↗</a>';
  openDialog(consult);
}
function showCase(id,updateURL=true) {
  const item=cases.find(item=>item.id===id);
  if(!item) return;
  if(updateURL && route==='cases.html') history.replaceState(null,'',location.pathname+location.search+'#'+item.id);
  $('.modal-content',drawer).innerHTML=`<p class="reference-note"><strong>演示案例 · 原站参考内容</strong><br>此案例来自参考站公开展示，不代表派桥留学服务或录取业绩。</p><span class="qs-badge">${e(item.qs)} · ${item.degree==='phd'?'博士':'硕士'}申请 · 历史数据</span><h3>${e(item.school)}</h3><p>${e(item.programme)}</p><div class="profile"><div><span>学生背景 · 原站演示</span><b>${e(item.background)}</b></div><div><span>申请方向</span><b>${e(item.title)}</b></div><div><span>成绩 · 原站演示</span><b>${e(item.gpa)}</b></div><div><span>语言 · 原站演示</span><b>${e(item.language)}</b></div></div><h4>参考背景要点</h4><ul>${item.points.map(point=>`<li>${e(point)}</li>`).join('')}</ul><h4>Offer 图片 · 演示案例</h4><div class="drawer-offers">${item.offers.map((offer,index)=>`<button data-offer="${item.id}-${index}"><img src="${offer.image}" alt="原站演示 Offer：${e(offer.caption)}"><span>原站演示 · 点击查看完整大图 ↗</span></button>`).join('')}</div><p><a class="source-link" href="${item.source}" target="_blank" rel="noopener">原站案例来源 ↗</a></p><p class="section-action"><button class="button" data-consult>微信咨询</button></p>`;
  openDialog(drawer);
}
let gallery=offers, galleryIndex=0;
function renderOffer() {
  const item=gallery[galleryIndex];
  $('.modal-header h2',lightbox).textContent=`演示案例 · ${item.caption}`;
  $('.modal-content',lightbox).innerHTML=`<p class="reference-note"><strong>原站演示 Offer · 非派桥留学真实业绩</strong><br>保留原图比例，可上下滚动阅读。</p><div class="lightbox-bar"><button data-gallery-step="-1" aria-label="上一张 Offer">← 上一张</button><span>${galleryIndex+1} / ${gallery.length}</span><button data-gallery-step="1" aria-label="下一张 Offer">下一张 →</button></div><img class="modal-image" src="${item.image}" alt="演示案例完整 Offer：${e(item.caption)}">`;
  $('.modal-content',lightbox).scrollTop=0;
}
function showOffer(id) {
  galleryIndex=offers.findIndex(item=>item.offerId===id);
  if(galleryIndex<0) return;
  gallery=offers;
  renderOffer(); openDialog(lightbox);
}
function stepOffer(delta) {
  const focusedStep=document.activeElement?.dataset?.galleryStep;
  galleryIndex=(galleryIndex+delta+gallery.length)%gallery.length;
  renderOffer();
  if(focusedStep) $(`[data-gallery-step="${focusedStep}"]`,lightbox).focus();
}

$$('[data-demo-form]').forEach(form => {
  form.addEventListener('submit',event => {
    event.preventDefault();
    if(!form.reportValidity()) return;
    const status=$('.form-status',form);
    if(form.dataset.demoForm==='subscribe') status.textContent='订阅演示完成，邮箱未发送或保存。';
    else { status.textContent='演示完成，资料未发送或保存。请通过微信咨询。'; showConsult(); }
    form.reset();
    const counter=$('[data-message-count]',form); if(counter) counter.textContent='0 / 500';
  });
  const message=$('textarea',form), counter=$('[data-message-count]',form);
  if(message&&counter) message.addEventListener('input',()=>{counter.textContent=`${message.value.length} / 500`;});
});
if('IntersectionObserver' in window) {
  const spyLinks=$$('[data-spy-link]');
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries) if(entry.isIntersecting) spyLinks.forEach(link=>link.classList.toggle('is-active',link.hash==='#'+entry.target.id));
  },{rootMargin:'-100px 0px -55% 0px'});
  new Set(spyLinks.map(link=>$(link.hash)).filter(Boolean)).forEach(section=>observer.observe(section));
}
function syncLocation() {
  if(route!=='cases.html') return;
  selectedRegion=normaliseRegion(new URLSearchParams(location.search).get('region'));
  selectedDegree=normaliseDegree(new URLSearchParams(location.search).get('degree'));
  filterCases(false);
  if(/^#case-\d+$/.test(location.hash)) showCase(location.hash.slice(1),false);
  else if(drawer.open) closeDialog(drawer);
}
window.addEventListener('hashchange',syncLocation);
window.addEventListener('popstate',syncLocation);
if(route==='cases.html' && /^#case-\d+$/.test(location.hash)) showCase(location.hash.slice(1),false);

function trapFocus(event,root) {
  const elements=$$('a[href],button:not([disabled]),input,select,textarea,summary',root).filter(el=>!el.closest('[hidden]'));
  if(!elements.length) return;
  const first=elements[0],last=elements.at(-1);
  if(event.shiftKey && (document.activeElement===first||!root.contains(document.activeElement))) {event.preventDefault();last.focus();}
  else if(!event.shiftKey && (document.activeElement===last||!root.contains(document.activeElement))) {event.preventDefault();first.focus();}
}
document.addEventListener('keydown',event => {
  if(event.key==='Escape' && document.body.classList.contains('menu-open')) { setMenu(false); menuButton.focus(); }
  if(event.key==='Tab' && document.body.classList.contains('menu-open')) trapFocus(event,mobileMenu);
  if(event.key==='Tab') { const top=$$('dialog[open]').at(-1); if(top) trapFocus(event,top); }
  if(lightbox.open && ['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); stepOffer(event.key==='ArrowRight'?1:-1); }
});
document.addEventListener('click',event => {
  const target=event.target.closest('button,a');
  if(!target) return;
  if(target.matches('[data-consult]')) {event.preventDefault();showConsult();}
  else if(target.matches('[data-close-dialog]')) closeDialog(target.closest('dialog'));
  else if(target.matches('[data-case]')) {event.preventDefault();showCase(target.dataset.case);}
  else if(target.matches('[data-offer]')) showOffer(target.dataset.offer);
  else if(target.matches('[data-gallery-step]')) stepOffer(Number(target.dataset.galleryStep));
  else if(target.matches('[data-filter]')) {
    if(target.dataset.filter==='region') selectedRegion=normaliseRegion(target.dataset.value); else selectedDegree=normaliseDegree(target.dataset.value);
    filterCases();
  }
  else if(target.matches('[data-reset-filters]')) {selectedRegion='all';selectedDegree='all';filterCases();}
  else if(target.matches('[data-back-top]')) window.scrollTo({top:0,behavior:reduceMotion?'instant':'smooth'});
});
