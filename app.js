
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const e = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const route = location.pathname.split('/').pop() || 'index.html';
const activeRoute = route === 'service-vip.html' ? 'services.html' : route;
$$('.main-nav a, .offcanvas-menu nav a').forEach(link => {
  const active = link.getAttribute('href').split('#')[0] === activeRoute;
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
const lightbox=createDialog('lightbox','录取文件');
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
  dialog.close();
}
function showConsult() {
  $('.modal-content',consult).innerHTML='<img src="assets/brand/wechat-qr.png" width="330" height="330" alt="PiBridge 派桥留学官方微信客服二维码"><h3>PiBridge 派桥留学</h3><p>使用微信扫一扫，或保存二维码后在微信中识别。</p><p>此页面不会保存刚才填写的信息，请在微信中重新发送申请背景。</p><a href="assets/brand/wechat-qr.png" target="_blank" rel="noopener">打开二维码原图</a>';
  openDialog(consult);
}
const offerLinks=$$('a[data-published-offer]');
let galleryIndex=0;
function renderOffer() {
 const link=offerLinks[galleryIndex];
 const title=`${link.dataset.school} · ${link.dataset.programme}`;
 $('.modal-header h2',lightbox).textContent=title;
 $('.modal-content',lightbox).innerHTML=`<div class="lightbox-bar"><button data-gallery-step="-1" aria-label="上一张 Offer">上一张</button><span>${galleryIndex+1} / ${offerLinks.length}</span><button data-gallery-step="1" aria-label="下一张 Offer">下一张</button></div><img class="modal-image" src="${e(link.dataset.publishedOffer)}" alt="${e(title)}完整录取文件">`;
 $('.modal-content',lightbox).scrollTop=0;
}
function showOffer(image) {
 galleryIndex=offerLinks.findIndex(link=>link.dataset.publishedOffer===image);
 if(galleryIndex<0) return;
 renderOffer(); openDialog(lightbox);
}
function stepOffer(delta) {
 const focusedStep=document.activeElement?.dataset?.galleryStep;
 galleryIndex=(galleryIndex+delta+offerLinks.length)%offerLinks.length;
 renderOffer();
 if(focusedStep) $(`[data-gallery-step="${focusedStep}"]`,lightbox).focus();
}

$$('[data-form="qr"]').forEach(form => {
  form.addEventListener('submit',event => {
    event.preventDefault();
    if(!form.reportValidity()) return;
    showConsult();
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
  else if(target.matches('[data-published-offer]')) {event.preventDefault();showOffer(target.dataset.publishedOffer);}
  else if(target.matches('[data-gallery-step]')) stepOffer(Number(target.dataset.galleryStep));
  else if(target.matches('[data-back-top]')) window.scrollTo({top:0,behavior:reduceMotion?'instant':'smooth'});
});
