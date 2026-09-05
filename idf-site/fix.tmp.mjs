import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pages=['/','/about/','/real-estate/','/services/','/contact/'];
for (const w of [320,375,390,414,768]) {
  const p=await b.newPage({viewport:{width:w,height:844},isMobile:w<800,hasTouch:w<800});
  let worst=0, worstPage='', bad=0;
  for (const path of pages) {
    await p.goto('http://127.0.0.1:8971'+path,{waitUntil:'networkidle'});
    const r=await p.evaluate(()=>{
      const vw=document.documentElement.clientWidth;
      let over=0, count=0;
      for (const el of document.querySelectorAll('*')) {
        const b=el.getBoundingClientRect();
        if (b.width===0||b.height===0) continue;
        if (getComputedStyle(el).position==='fixed') continue;
        if (b.right>vw+1){count++; over=Math.max(over, Math.round(b.right-vw));}
      }
      return {vw, docW:document.documentElement.scrollWidth, over, count};
    });
    if (r.over>worst){worst=r.over; worstPage=path;}
    bad += r.count;
    if (r.docW>r.vw) console.log(`  !! ${path} docW ${r.docW} > vw ${r.vw}`);
  }
  console.log(`${String(w).padStart(4)}px  overflowing elements: ${String(bad).padStart(3)}  worst overhang: ${worst}px ${worstPage}`);
  await p.close();
}
// menu still opens?
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await p.goto('http://127.0.0.1:8971/',{waitUntil:'networkidle'});
console.log('\nclosed panel height:', await p.evaluate(()=>Math.round(document.querySelector('.hp-menu-panel').getBoundingClientRect().height)));
await p.locator('.hp-menu summary').click();
await p.waitForTimeout(250);
console.log('after tap — open   :', await p.evaluate(()=>document.querySelector('.hp-menu').open));
console.log('panel height       :', await p.evaluate(()=>Math.round(document.querySelector('.hp-menu-panel').getBoundingClientRect().height)));
console.log('links visible      :', await p.locator('.hp-menu-panel a').count());
const ov=await p.evaluate(()=>{const vw=document.documentElement.clientWidth;let c=0;
  for(const el of document.querySelectorAll('.hp-menu-panel *')){const b=el.getBoundingClientRect();if(b.width&&b.right>vw+1)c++;}return c;});
console.log('overflow when open :', ov);
await b.close();
