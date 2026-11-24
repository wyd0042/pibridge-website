// Previous admission examples have been removed. New documents live in assets/published-offers.json.
export const cases = [];
export const regions = [{id:'hk',name:'港新'},{id:'uk',name:'英国'},{id:'us',name:'美国'},{id:'ca',name:'加拿大'},{id:'au',name:'澳新'},{id:'eu',name:'欧洲'}];
export const degrees = [{id:'master',name:'硕士'},{id:'phd',name:'博士'}];
export const offers = cases.flatMap(item => item.offers.map((offer,index) => ({...offer,caseId:item.id,offerId:`${item.id}-${index}`,school:item.school,programme:item.programme,demo:true})));
export function normaliseRegion(value) { if(value==='sg') return 'hk'; return regions.some(r=>r.id===value)?value:'all'; }
export function normaliseDegree(value) { return degrees.some(d=>d.id===value)?value:'all'; }
export function selectCases(region='all',degree='all') { const r=normaliseRegion(region), d=normaliseDegree(degree); return cases.filter(item=>(r==='all'||item.region===r)&&(d==='all'||item.degree===d)); }
