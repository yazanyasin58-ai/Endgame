import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await p.goto('http://127.0.0.1:8995/',{waitUntil:'networkidle'});

// vertical scrolling must still work
const before=await p.evaluate(()=>window.scrollY);
await p.evaluate(()=>window.scrollTo(0,1200));
await p.waitForTimeout(200);
const after=await p.evaluate(()=>window.scrollY);
console.log('vertical scroll   :', before, '->', Math.round(after), after>500?'WORKS':'*** BROKEN ***');

// carousel must still scroll horizontally
await p.evaluate(()=>document.querySelector('.rc-track').scrollIntoView());
await p.waitForTimeout(200);
const t0=await p.evaluate(()=>{const t=document.querySelector('.rc-track');return {sw:t.scrollWidth,cw:t.clientWidth,sl:t.scrollLeft};});
await p.evaluate(()=>{document.querySelector('.rc-track').scrollLeft=300;});
await p.waitForTimeout(200);
const t1=await p.evaluate(()=>document.querySelector('.rc-track').scrollLeft);
console.log('carousel scroller :', t0.cw,'->',t0.sw, '| scrollLeft', t0.sl,'->',Math.round(t1), t1>100?'SCROLLS':'*** BROKEN ***');

// call bar still fixed and full width
const cb=await p.evaluate(()=>{const el=document.querySelector('.callbar'); if(!el) return null;
  const r=el.getBoundingClientRect(); return {w:Math.round(r.width), bottom:Math.round(r.bottom),
  vh:window.innerHeight, pos:getComputedStyle(el).position};});
console.log('call bar          :', JSON.stringify(cb));

// document width across sizes and pages
for (const w of [320,360,375,390,414,430,768]) {
  await p.setViewportSize({width:w,height:844});
  let bad=[];
  for (const path of ['/','/about/','/real-estate/','/projects/','/contact/']) {
    await p.goto('http://127.0.0.1:8995'+path,{waitUntil:'networkidle'});
    const r=await p.evaluate(()=>({vw:document.documentElement.clientWidth,
      doc:document.documentElement.scrollWidth, body:document.body.scrollWidth,
      canScrollX: document.documentElement.scrollWidth > document.documentElement.clientWidth}));
    if (r.canScrollX) bad.push(`${path} doc:${r.doc} vw:${r.vw}`);
  }
  console.log(`${String(w).padStart(4)}px  horizontal overflow: ${bad.length? bad.join(', ') : 'none'}`);
}
await b.close();
