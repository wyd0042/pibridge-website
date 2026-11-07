// Replace approved public materials here. Keep demo:true until a case is verified.
export const regions = [
  { id: 'uk', name: '英国', english: 'United Kingdom', code: 'UK' },
  { id: 'us', name: '美国', english: 'United States', code: 'US' },
  { id: 'au', name: '澳大利亚', english: 'Australia', code: 'AU' },
  { id: 'ca', name: '加拿大', english: 'Canada', code: 'CA' },
  { id: 'hk', name: '中国香港', english: 'Hong Kong', code: 'HK' },
  { id: 'sg', name: '新加坡', english: 'Singapore', code: 'SG' }
];
export const cases = [
  {
    id: 'mit-demo', region: 'us', demo: true, placeholder: false,
    school: 'MIT Sloan School of Management', programme: 'Master of Finance · 18-Month',
    title: '金融硕士申请 · 演示案例', background: '示例同学 · 清华大学（演示背景）',
    tags: ['GPA 3.8（演示）', '雅思 8.0（演示）'], image: 'assets/offers/mit-demo.jpg',
    summary: '本案例仅用于展示背景资料、Offer 图片和详情排版。学生称呼、本科背景与成绩均为模板中的演示设定，不代表 PiBridge 的真实服务或录取业绩。图片沿用已有脱敏及水印。'
  },
  {
    id: 'neutral-demo', region: 'uk', demo: true, placeholder: false,
    school: '示例大学', programme: '示例硕士专业', title: '硕士申请资料 · 演示案例',
    background: 'A同学 · 背景信息待替换', tags: ['背景待补充', '材料排版演示'],
    image: 'assets/offers/demo-offer.png', summary: '这是一份明确标注的示例材料，并非录取通知书。用于验证图片比例、案例筛选和大图阅读效果。'
  },
  ...Array.from({ length: 18 }, (_, index) => ({
    id: `placeholder-${index + 1}`, region: regions[index % regions.length].id,
    demo: true, placeholder: true, school: '案例展示位／待替换', programme: '硕士申请 · 展示占位',
    title: `${regions[index % regions.length].name}方向 · 案例展示位`,
    background: '学生背景待替换', tags: ['院校待替换', '申请资料待补充'],
    image: 'assets/offers/placeholder.svg',
    summary: '此位置用于展示页面布局。院校、专业、学生背景及录取材料将在获得授权后替换，目前不代表任何真实录取。'
  }))
];
export const offers = [
  ...cases.map(item => ({ ...item, offerId: item.id })),
  ...[0, 1].map(index => ({ ...cases[index + 2], offerId: `extra-placeholder-${index}`, school: '案例展示位／待替换' }))
];
export function normaliseRegion(value) {
  return regions.some(region => region.id === value) ? value : 'all';
}
export function selectCases(region = 'all') {
  const selected = normaliseRegion(region);
  return selected === 'all' ? cases : cases.filter(item => item.region === selected);
}
