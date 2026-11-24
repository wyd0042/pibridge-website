import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { regions } from '../cases-data.js';
import publishedOffers from '../assets/published-offers.json' with { type: 'json' };

const e = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const img = (name, alt, cls = '') => `<img src="assets/img/${name}" alt="${e(alt)}" class="${cls}" loading="lazy">`;
const button = (text = '获取免费申请评估', href = 'contact.html#eval-form', outline = false) => `<a class="button${outline?' outline':''}" href="${href}">${text}</a>`;
const head = (en, title, desc = '', extra = '') => `<div class="section-head ${extra}"><span class="eyebrow">${en}</span><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div>`;
const section = (content, cls = '', id = '') => `<section class="section ${cls}"${id?` id="${id}"`:''}><div class="container">${content}</div></section>`;
const subHero = (en, title, desc, light = false, visual = '') => `<section class="sub-hero ${light?'light':'dark'}"><div class="container ${visual?'hero-grid':''}"><div><span class="eyebrow">${en}</span><h1>${title}</h1><p>${desc}</p><div class="breadcrumb"><a href="index.html">首页</a><span>/</span><span>${title.replace(/<[^>]+>/g,'')}</span></div></div>${visual}</div></section>`;
const callto = (title = '把申请目标，变成今天的行动', en = 'START YOUR APPLICATION', photo = false) => section(`<div class="callto-text">${head(en,title)}<div class="actions">${button()}${button('查看录取案例','cases.html#admissions',true)}</div></div>`, `callto dark${photo?' photo-callto':''}`);
const brand = () => `<a class="brand" href="index.html" aria-label="PiBridge 派桥留学首页"><img src="assets/brand/wordmark.png" width="375" height="155" alt="PiBridge"><span>派桥留学<small>STUDY ABROAD</small></span></a>`;
const navLinks = [
 ['首页','index.html'],
 ['申请服务','services.html'],
 ['录取案例','cases.html'],
 ['导师团队','about.html#faculty-team']
];
const navLink = ([label, href]) => `<a href="${href}">${label}</a>`;
const navLeft = navLinks.slice(0,2).map(navLink).join('');
const navRight = navLinks.slice(2).map(navLink).join('');
function header() { return `<header class="header"><div class="container nav-row"><button class="menu-toggle" aria-label="打开导航菜单" aria-controls="mobile-navigation" aria-expanded="false"><span></span><span></span><span></span></button><nav class="main-nav nav-left" aria-label="主导航">${navLeft}</nav>${brand()}<nav class="main-nav nav-right" aria-label="主导航二">${navRight}</nav><button class="mobile-contact" data-consult>微信咨询</button></div></header><div data-header-spacer></div><div class="menu-overlay" data-close-menu hidden></div><aside class="offcanvas-menu" id="mobile-navigation" aria-label="手机导航" inert><div class="offcanvas-top"><b>PiBridge 派桥留学</b><button data-close-menu aria-label="关闭导航菜单">×</button></div><nav>${navLeft}${navRight}</nav></aside>`; }
function footer() { return `<footer class="footer"><div class="contact-ribbon"><div class="container"><span>CONTACT WITH US</span><h2>现在出发，规划你的下一程</h2><button data-consult>微信咨询 <b>↗</b></button></div></div><div class="container footer-main"><div class="footer-grid"><div><h3>联系方式</h3><ul><li>PiBridge 派桥留学</li><li><button data-consult>微信扫码联系</button></li></ul><button class="footer-qr" data-consult><img src="assets/brand/wechat-qr.png" width="330" height="330" alt="PiBridge 微信客服二维码" loading="lazy"></button></div><div><h3>快速入口</h3><ul class="two-col">${navLinks.map(link=>`<li>${navLink(link)}</li>`).join('')}</ul></div><div id="featured-cases"><h3>精选录取案例</h3>${featuredOffers.map(({school,programme,originalSchool,originalProgramme,status,image}) => `<div class="footer-news"><a href="${offerPageLink(image)}">${e(school)} · ${e(programme)}</a><span>${e(originalSchool ?? status)}${originalProgramme ? ` · ${e(originalProgramme)}` : ''}</span></div>`).join('')}</div><div><h3>微信咨询</h3><p>填写邮箱后，扫码继续沟通。</p><form class="subscribe-form" data-form="qr"><label class="sr-only" for="subscribe-email">邮箱</label><input id="subscribe-email" name="email" type="email" placeholder="邮箱地址" required autocomplete="email"><button type="submit">查看微信二维码</button></form><small>提交后显示微信二维码；邮箱不会保存。</small></div></div><div class="copyright">© ${new Date().getFullYear()} PiBridge 派桥留学</div></div></footer><aside class="floating-tools" aria-label="快捷联系"><button data-consult aria-label="微信咨询">微信<span>扫码咨询</span></button><a href="contact.html#eval-form">评估<span>申请方向</span></a><button data-back-top aria-label="回到顶部">↑<span>返回顶部</span></button></aside><div class="mobile-bar"><a href="contact.html#eval-form">申请评估</a><button data-consult>微信咨询 ↗</button></div>`; }
function layout(title, body, page) { return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}｜PiBridge 派桥留学</title><meta name="description" content="PiBridge 派桥留学，专注数学、统计学、数据科学、金融工程及计算机方向的硕博留学申请。"><meta name="theme-color" content="#1f8de4"><link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"><script type="module" src="app.js"></script></head><body data-page="${page}"><a href="#main" class="skip-link">跳至正文</a>${header()}<main id="main">${body}</main>${footer()}<noscript><p class="noscript">浏览静态内容无需 JavaScript；录取材料可直接查看。<a href="assets/brand/wechat-qr.png">查看微信二维码</a></p></noscript></body></html>\n`; }
const roles = [
 ['规划顾问','背景诊断与目标定位','整理现有背景，讨论申请地区、院校层次和时间安排。','选校方案 · 时间规划表'],
 ['文书导师','素材访谈与文书主线','通过访谈梳理经历，连接专业动机、能力证据和未来计划。','PS / SOP / CV / 推荐信'],
 ['申请老师','网申递交与材料复核','核对材料、填写要求与递交状态，跟进院校补件信息。','递交记录 · 材料清单'],
 ['面签导师','面试签证与行前衔接','围绕面试表达、签证文件及行前事项提供专项准备。','模拟面试 · 签证清单'],
 ['项目管家','任务、版本与节点管理','记录每周任务、材料版本与进展，安排提醒及协作沟通。','周度任务 · 进度记录']
];
const stages = [
 ['前期咨询与规划','了解现状，梳理意向，讨论适合自己的申请方向。',[
  ['确定留学意向','讨论地区、专业、预算与入学时间，在明确需求后判断服务是否匹配。'],['了解学生现状','收集成绩、语言、课程、科研、实习与作品集等已有信息，列出需要补充的资料。'],['初步未来蓝图','结合职业或研究兴趣，建立初步院校清单和下一阶段准备目标。']]],
 ['申请准备','背景评估、院校方案与材料准备并行推进。',[
  ['背景评估与方案制定','整理背景 → 初选专业 → 对比要求 → 确认差距 → 调整院校 → 安排节点 → 明确协作分工。'],['硬性四维标准规划','结合项目要求，安排 GPA、IELTS / TOEFL、GRE / GMAT 和必要的专业考试准备。'],['软性六维背景规划','从学术、实践、创新、领导、沟通及社会参与六个方向整理能力证据，按实际需要补强。'],['双导师协作','规划与文书角色定期核对方向，避免申请目标、经历表达和材料安排相互脱节。']]],
 ['申请提交','核查材料与截止日期，记录递交及反馈。',[
  ['申请材料制作','准备 PS / SOP、CV、推荐信和研究计划，逐轮检查事实、逻辑及项目匹配。'],['网申系统递交','核对个人信息、上传文件、付款要求和截止日期，提交前进行最终确认。'],['双向跟进机制','记录系统状态与院校邮件，及时处理补件、面试安排和其他后续要求。']]],
 ['录取与行前','从结果比较到入学准备，逐项完成衔接。',[
  ['录取结果与选择','对比项目课程、费用、条件及回复时限，梳理需要进一步确认的问题。'],['签证材料准备','按目的地和个人情况检查官方要求，整理文件与关键日期。'],['行前与海外衔接','准备住宿、选课、报到和入境清单，提前确认遇到问题时的联系渠道。']]]
];
function processGrid() { return `<ol class="process-grid">${stages.map(([title,desc],i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><h3><a href="services.html#stage-${i+1}">${title}</a></h3><p>${desc}</p></li>`).join('')}</ol>`; }
// Preserve upload order in a single row-major wall.
const orderedOffers = publishedOffers;
const offerAnchor = image => `offer-${image.split('/').at(-1).replace(/\.(png|jpe?g)$/, '')}`;
const offerPageLink = image => `cases.html#${e(offerAnchor(image))}`;
const featuredOffers = orderedOffers.slice(0,4);
function publishedOfferCard({school,programme,intake,status,image}, preview=false) {
 return `<article class="offer-card published-offer" id="${e(offerAnchor(image))}"><span class="offer-image"><img src="${e(image)}" alt="${e(school)} · ${e(programme)}录取文件" loading="lazy" draggable="false"></span><div class="offer-caption"><strong>${e(school)}</strong><span>${e(programme)}</span><small>${e(status)}${intake?` · ${e(intake)}`:''}</small></div></article>`;
}
function heroOffers() { return `<div class="hero-offers" aria-label="精选脱敏 Offer">${featuredOffers.slice(0,3).map(({school,image}) => `<div><img src="${e(image)}" alt="${e(school)}脱敏 Offer"><span>${e(school)}</span></div>`).join('')}</div>`; }
function evaluationForm(prefix) { return `<form class="evaluation-form" data-form="qr"><p class="form-demo-note">填写后显示微信二维码；此页面不会保存填写信息，请在微信中重新发送申请背景。</p><div class="form-grid"><label>姓名 *<input name="name" required placeholder="你的称呼" autocomplete="name"></label><label>手机号码 *<input name="phone" type="tel" required placeholder="联系电话" autocomplete="tel"></label><label>当前年级 / 学历<input name="education" placeholder="例如：本科三年级" autocomplete="off"></label><label>意向地区<select name="destination"><option value="">请选择申请方向</option>${regions.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}</select></label><label class="full">申请背景与问题<textarea name="message" maxlength="500" rows="4" placeholder="可简要描述申请方向和目前的准备情况"></textarea><small data-message-count>0 / 500</small></label></div><button class="button" type="submit">提交并查看微信二维码</button></form>`; }
const brandSlogan = '<span lang="en">The world is your oyster.</span>';
const brandFocus = '专注数学、统计学、数据科学、金融工程及计算机方向的硕博留学申请。';
const mentorGroups = [
 { title:'学术导师', description:'从研究与学术发展角度，提供申请指导。', mentors:[
  ['Ryan','牛津大学博士','在数值领域发表顶刊'],
  ['Rocky','香港中文大学博士 · 港府奖学金（HKPFS）','在优化Opt领域发表顶刊'],
  ['Yu','牛津大学博士','在 Journal of Fluid Mechanics 流体力学顶刊发表研究'],
  ['Yao','牛津大学博士','在 Journal of Fluid Mechanics 流体力学顶刊发表研究'],
 ]},
 { title:'行业导师', description:'结合科技、金融、市场营销与人力资源领域的行业经验，提供职业发展视角。', mentors:[
  // 算法与技术
  ['Mark','新交所上市公司 · 大模型算法',''],
  ['Matin','头部大模型公司 · 视频生成算法工程师',''],
  ['Leo','头部互联网大厂 · 风控算法工程师',''],
  ['Yan','头部科技公司 · 算法工程师',''],
  ['Jacob','Web3 资深算法工程师',''],
  ['Ana','中资股份制银行 · 算法工程师',''],
  ['Paul','国内头部半导体设备企业 · 算法工程师',''],
  // 产品与市场
  ['Sandy','互联网大厂AI产品经理',''],
  ['Jason','知名金融科技公司 · 产品经理',''],
  ['Wilson','头部手机品牌海外营销主管',''],
  // 投资、证券与量化
  ['Teddy','深创投投资经理',''],
  ['Thomas','国资PE投资分析师',''],
  ['Alex','互联网大厂科技投资分析师',''],
  ['Erin','互联网大厂战投部门分析师',''],
  ['Eric','中资大型券商 · 债券 IBD',''],
  ['Vincent','头部券商研究所 · 研究员',''],
  ['Peter','量化策略工程师（百亿规模）',''],
  // 监管与风控
  ['Cici','香港三大监管机构 · 风控部门',''],
  // 人力资源
  ['Danny','头部一级卖方HR Head',''],
  ['Robbin','头部互联网大厂HR',''],
 ]},
];

function mentorCard([name, background, focus], category = '') {
 const heading = category ? 'h3' : 'h4';
 return `<article class="mentor-card"><div>${category ? `<small>${e(category)}</small>` : ''}
  <${heading}>${e(name)}</${heading}><b>${e(background)}</b>${focus ? `<p>${e(focus)}</p>` : ''}
 </div></article>`;
}

function mentorDirectory() {
 return mentorGroups.map(group => `<div class="mentor-group">
  <h3>${e(group.title)}</h3><p>${e(group.description)}</p>
  <div class="mentor-grid">${group.mentors.map(mentor => mentorCard(mentor)).join('')}</div>
 </div>`).join('');
}
const milestones = ['成立工作室','建立标准流程','扩充协作角色','完善定位方法','组织模式升级','整合服务环节','案例资料积累','拓展教育资源'];

function home() {
 const slides=[
  ['PiBridge 派桥留学',brandSlogan,brandFocus,'hero-pexels-campus.jpg',button('查看高端服务','service-vip.html')+button('获取免费申请评估','contact.html#eval-form',true),''],
  ['Process Management','申请节点不靠临时记忆推进','用任务清单记录材料、责任和时间，把每一步的进展变成可核对的信息。','hero-pexels-campus-walk.jpg',button('查看服务流程','services.html'),`<div class="hero-flow">${stages.map(([title,desc],i)=>`<div><b>0${i+1}　${title}</b><small>${desc}</small></div>`).join('')}</div>`],
  ['Offer Wall','用录取案例看清申请方向','查看已上传的录取材料，了解各个录取项目。','hero-pexels-library.jpg',button('查看录取案例','cases.html'),heroOffers()],
  ['Landing Support','拿到 Offer 之后，继续准备下一程','入学文件、签证、住宿与报到都有各自节点，提前安排，逐项确认。','hero-pexels-travel.jpg',button('预约申请评估'),'']
 ];
 let html=`<section class="hero" aria-label="首页服务轮播"><div class="hero-slider">${slides.map(([en,title,desc,image,actions,visual],i)=>`<article class="hero-slide${i===0?' active':''}" data-slide="${i}" aria-hidden="${i!==0}" ${i?'inert':''} style="--hero-image:url('assets/img/${image}')"><div class="container ${visual?'hero-grid':''}"><div class="hero-copy"><span class="eyebrow">${en}</span><${i?'h2':'h1'}>${title}</${i?'h2':'h1'}><p>${desc}</p><div class="actions">${actions}</div></div>${visual}</div></article>`).join('')}<div class="hero-controls container"><div class="hero-dots">${slides.map((_,i)=>`<button data-slide-to="${i}" aria-label="切换至第 ${i+1} 屏" aria-pressed="${i===0}"><span></span></button>`).join('')}</div><button class="slider-pause" data-slider-pause aria-pressed="false">暂停轮播</button></div></div></section>`;
 html+=`<section class="benefits"><div class="container benefit-grid">${['高端5v1定制','精细化管理','案例策略复盘','全流程陪伴落地'].map((title,i)=>`<button class="benefit-item${i===0?' is-active':''}" data-slide-to="${i}"><small>0${i+1} / 04</small><h2>${title}</h2><p>${['规划、材料、申请与后续事项，由不同角色协作推进。','材料清单、时间节点与准备状态，形成清楚的过程记录。','结合公开的学生背景与录取资料，了解不同的申请方向。','从前期沟通到行前准备，梳理各阶段需要确认的事项。'][i]}</p></button>`).join('')}</div></section>`;
 html+=`<section class="vip-strip dark"><div class="container vip-strip-grid"><div><h2>高端5v1 VIP团队</h2><p>五类角色 · 协作示意</p><a href="service-vip.html">了解5v1服务 →</a></div>${roles.map(role=>`<div><b>${role[0]}</b><p>${role[3]}</p></div>`).join('')}</div></section>`;
 html+=section(head('WHY CHOOSE PIBRIDGE','为什么选择派桥留学')+`<div class="proof-grid">${['一人一案','多维度定位','文书深度访谈','后续申请支持'].map((title,i)=>`<article class="proof-card"><span class="proof-icon">${['◇','◎','✎','↗'][i]}</span><h3>${title}</h3><p>${['从具体背景与个人目标出发，讨论适合自己的准备路径。','同时考虑课程、经历、预算与专业要求，建立院校组合。','整理经历中的具体行动与收获，形成清楚的个人表达。','根据阶段进展梳理后续选择与准备事项。'][i]}</p></article>`).join('')}</div>`);
 html+=section(head('SERVICE PROCESS','把申请拆成看得见的节点','四个阶段，逐项准备；查看完整流程了解各阶段细节。')+processGrid(),'soft');
 html+=section(head('ACADEMIC ADVISORY TEAM','学术顾问团队','学术导师与行业导师，分别从研究与职业发展角度提供申请指导。')+mentorDirectory());
 html+=section(`<div class="about-grid"><div class="about-photo">${img('hero-campus.jpg','PiBridge 留学申请服务')}</div><div>${head('BRAND STORY','陪伴每一种可能走向世界','从信息梳理开始，让目标选择、准备重点与执行节奏逐步清楚。')}<ul class="check-list"><li>围绕学生背景和申请目标，讨论院校与专业方向。</li><li>梳理材料、申请节点与入学准备事项。</li><li>结合已公开录取材料，了解不同申请路径。</li></ul>${button('了解 PiBridge','about.html#story')}</div></div>`,'','about');
 html+=section(head('OFFER WALL','Offer 展示与申请方向','按上传顺序连续展示录取材料。','center')+`<div class="offer-grid">${orderedOffers.map(offer=>publishedOfferCard(offer,true)).join('')}</div><p class="center section-action">${button('查看全部 Offer 墙','cases.html#offers')}</p>`);
 html+=`<section class="quote dark" id="quote"><div class="container quote-grid"><div>${head('APPLICATION ASSESSMENT','获取免费申请评估','填写基本情况后，扫码通过微信继续沟通。')}${evaluationForm('home')}</div><div class="quote-photo">${img('service-consult.jpg','留学申请咨询')}<p>先了解背景，再沟通申请方向</p></div></div></section>`;
 return html+callto('把目标院校，拆成今天的准备计划','START YOUR APPLICATION',true);
}
function vip() {
 let html=subHero('HIGH-END VIP','高端5v1定制化申请服务','围绕一名学生，协调五类角色的分工、材料与申请节点。');
 html+=section(head('TEAM STRUCTURE','一名学生，五类角色协同','让职责与交付物清楚可见，减少准备过程中的信息遗漏。')+`<div class="ring-layout"><div class="ring-stage" aria-label="五类角色围绕学生协作"><div class="ring-center"><b>学生</b><small>ONE STUDENT</small></div>${roles.map((role,i)=>`<div class="ring-node p${i+1}"><span>${['◇','✎','▤','▱','◷'][i]}</span><b>${role[0]}</b><small>${role[3]}</small></div>`).join('')}</div><div class="role-list">${roles.map(role=>`<article><b>${role[0]}</b><div><p>${role[2]}</p><small>交付物：${role[3]}</small></div></article>`).join('')}<article><b>团队复核</b><p>在院校清单、材料事实与递交节点进行交叉核对。</p></article></div></div>`);
 html+=section(head('PROCESS MANAGEMENT','精细化管理，是可追踪的任务系统','以节点、清单与版本记录，让每次协作有据可查。')+`<div class="management-grid">${['申请时间轴','材料版本记录','网申状态跟进','周度任务沟通'].map((t,i)=>`<article class="proof-card"><span class="small-number">0${i+1}</span><h3>${t}</h3><p>${['记录截止日期与准备顺序。','标记修改内容与待确认事项。','集中核对递交和补件信息。','同步当前进度与下一步安排。'][i]}</p></article>`).join('')}</div>`,'soft');
 html+=section(head('VIP SERVICE SCOPE','VIP 服务范围','参考方案展示，具体服务项目需另行沟通确认。')+`<div class="scope-grid">${['背景评估与提升','专业与院校定位','申请文书准备','申请与入学衔接'].map((t,i)=>`<article class="proof-card"><span class="proof-icon">${['◇','◎','✎','↗'][i]}</span><h3>${t}</h3><p>${roles[i][2]}</p></article>`).join('')}</div>`,'soft');
 html+=section(`<div class="comparison-grid"><article><span class="eyebrow">INITIAL CONSULTATION</span><h2>前期 1V1 沟通</h2><ul class="check-list"><li>了解个人背景与申请目标</li><li>说明申请阶段与准备重点</li><li>沟通需求和协作方式</li></ul></article><article class="dark"><span class="eyebrow">TEAM COLLABORATION</span><h2>后续 5v1 协作</h2><ul class="check-list"><li>规划、材料与递交协调</li><li>任务清单与节点记录</li><li>关键材料交叉核对</li></ul></article></div>`);
 return html+callto('你的背景，适合怎样的申请路径？','VIP ASSESSMENT');
}
function about() {
 let html=subHero('ABOUT PIBRIDGE','陪伴每一种可能走向世界','了解 PiBridge 的品牌理念和导师团队。',true);
 html+=section(`<div class="about-grid"><div class="story-visual dark"><strong>${brandSlogan}</strong><small>PiBridge 派桥留学</small></div>
  <div>${head('BRAND PHILOSOPHY','连接学生与世界顶尖学术殿堂',brandFocus)}
  <p>PiBridge 提供覆盖英国、中国香港、新加坡和美国的申请服务，从选校策略、学术背景提升到文书打磨与面试辅导，陪伴学生完成申请。</p></div></div>`,'','story');
 html+=section(head('OUR VALUES','服务理念','以清晰的信息、认真的准备和可追踪的协作，连接每一步。')+`<div class="proof-grid">${['尊重个体','过程透明','材料真实','持续沟通'].map((t,i)=>`<article class="proof-card"><span class="proof-icon">0${i+1}</span><h3>${t}</h3><p>${['从不同经历与目标出发。','明确节点、任务与进展。','所有事实与成果应可核对。','及时讨论变化与下一步。'][i]}</p></article>`).join('')}</div>`);
 html+=section(head('ACADEMIC ADVISORY TEAM','学术顾问团队','PiBridge 学术顾问团队由高校博士导师和一线行业从业者组成。')+mentorDirectory(),'soft','faculty-team');
 html+=section(head('OUR VISION','从申请准备，走向更长远的发展','从一次申请出发，持续关注学习目标与下一阶段的方向。')+`<div class="vision-grid">${['学习与研究','专业与实践','资源与协作'].map(t=>`<article><span>↗</span><h3>${t}</h3><p>连接信息与个人目标，探索适合的下一步。</p></article>`).join('')}</div>`,'soft');
 return html+callto('让下一程，从一次认真沟通开始');
}
function services() {
 let html=subHero('SERVICE PROCESS','把申请拆成看得见的节点','四大阶段，从初步沟通到入学准备；具体安排按个人情况确认。');
 html+=section(head('APPLICATION JOURNEY','四大阶段总览','选择任一阶段，查看对应的准备事项。')+processGrid());
 html+=`<section class="section soft"><nav class="stage-nav" aria-label="申请阶段"><div class="container">${stages.map(([title],i)=>`<a href="#stage-${i+1}" data-spy-link>0${i+1} ${title}</a>`).join('')}</div></nav><div class="container">${stages.map(([title,desc,items],i)=>`<div class="stage" id="stage-${i+1}"><aside class="stage-card"><span>0${i+1}</span><h2>${title}</h2><p>${desc}</p></aside><div class="accordion">${items.map(([heading,text],n)=>`<details${n===0?' open':''}><summary>${heading}</summary><div><p>${text}</p>${i===1&&n===1?'<div class="exam-tags"><span>GPA</span><span>IELTS</span><span>TOEFL</span><span>GRE / GMAT</span></div>':''}</div></details>`).join('')}</div></div>`).join('')}</div></section>`;
 return html+callto('不确定自己处在哪一步？','YOUR NEXT STEP');
}
function casesPage() {
 let html=subHero('ADMISSION OFFERS','录取 Offer 与案例','按上传顺序连续展示录取材料，后续材料将持续补充。');
 html+=section(`<span id="admissions"></span>${head('OFFER WALL','录取 Offer 展示墙',`当前共 ${orderedOffers.length} 份录取材料。`)}<div class="offer-grid">${orderedOffers.map(offer=>publishedOfferCard(offer)).join('')}</div>`,'soft','offers');
 return html+callto('从录取项目出发，讨论你的申请方向');
}
function contact() {
 return subHero('CONTACT US','获取免费申请评估','填写申请情况后，扫码通过微信继续沟通。',true)+section(`<div class="contact-grid"><div>${head('APPLICATION ASSESSMENT','预约申请评估','提交后显示微信二维码；此页面不会保存填写信息，请在微信中重新发送申请背景。')}${evaluationForm('contact')}</div><aside class="contact-card"><span class="eyebrow">WECHAT CONSULTATION</span><h2>微信咨询</h2><img src="assets/brand/wechat-qr.png" width="330" height="330" alt="PiBridge 派桥留学官方微信二维码"><p>使用微信扫一扫，或保存后在微信中识别。</p><button class="button" data-consult>打开微信二维码</button><div class="contact-detail"><h3>PiBridge 派桥留学</h3><p>请通过微信联系团队。</p></div></aside></div>`,'','eval-form')+section(head('LET’S MEET','线上沟通','说明你的申请阶段和问题，沟通合适的申请方向。')+`<div class="meeting-grid"><article class="proof-card"><span class="proof-icon">◎</span><h3>微信咨询</h3><p>扫码联系团队，沟通申请目标和准备事项。</p><button class="text-link" data-consult>打开微信二维码</button></article></div>`,'soft')+section(head('FREQUENTLY ASKED QUESTIONS','常见问题')+`<div class="accordion faq">${[['如何开始咨询？','点击微信咨询，扫码联系并说明希望讨论的申请方向。'],['录取案例有哪些资料？','录取案例页按上传顺序展示录取材料及对应项目，材料会持续补充。'],['填写表单后会发生什么？','页面会显示微信二维码。填写的信息不会保存在本网站，请在微信中重新发送申请背景。']].map(([q,a])=>`<details><summary>${q}</summary><div><p>${a}</p></div></details>`).join('')}</div>`);
}

export function renderPages() {
 const pages = {
  'index.html':layout('世界名校触手可及',home(),'home'),
  'service-vip.html':layout('高端5v1 VIP',vip(),'vip'),
  'about.html':layout('关于我们',about(),'about'),
  'services.html':layout('服务流程',services(),'services'),
  'cases.html':layout('品牌口碑与案例',casesPage(),'cases'),
  'contact.html':layout('联系我们',contact(),'contact')
 };
 return pages;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
 for(const [name,html] of Object.entries(renderPages())) await writeFile(new URL(`../${name}`,import.meta.url),html);
 console.log(`Generated ${Object.keys(renderPages()).length} static pages.`);
}
