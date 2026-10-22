import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const mode=process.argv[2]||'after';
const base=process.env.LUME_CHECK_URL||'http://localhost:3015/lume-candles';
const folder='docs/final-optimization';await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});const geometries=[];
try{for(const width of [1440,768,390]){
 const context=await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce'});const page=await context.newPage();
 for(const route of ['/', '/catalog/', '/catalog/embrace/']){
  await page.goto(base+route);await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);
  for(const img of await page.locator('main img:visible').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());}
  await page.evaluate(()=>scrollTo(0,0));
  const geometry=await page.locator('main').evaluate(main=>[...main.querySelectorAll('h1,h2,img,.product-photo,.configurator')].map(e=>{const r=e.getBoundingClientRect();return{tag:e.tagName,text:e.tagName==='IMG'?e.alt:e.textContent.slice(0,40),x:r.x,y:r.y,width:r.width,height:r.height};}));
  geometries.push({width,route,geometry});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(mode!=='before'){
   if(route==='/catalog/')assert.equal(await page.locator('.product-card').count(),40);
   for(const img of await page.locator('main img:visible').all())assert.match(await img.evaluate(i=>i.currentSrc),/optimized\/MEDIA-.*\.(webp|avif)$/);
  }
  await page.screenshot({path:`${folder}/${mode}-${width}-${route==='/'?'home':route.includes('embrace')?'product':'catalog'}.png`,fullPage:route!=='/catalog/'});
 }
 if(mode!=='before'){
  for(const route of ['/','/catalog/','/catalog/embrace/','/cart/','/checkout/','/about/','/delivery/','/payment/','/contacts/','/privacy/','/terms/']){
   await page.goto(base+route);const credit=page.locator('.developer-credit');await credit.scrollIntoViewIfNeeded();assert.equal(await credit.innerText(),'Сайт сделан Михаилом Милосердовым');
   const link=credit.locator('a');assert.equal(await link.getAttribute('href'),'https://t.me/milyy_gg');assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
  }
 }
 await context.close();
}
 if(mode!=='before'){
  const baseline=JSON.parse(await fs.readFile(`${folder}/geometry-before.json`,'utf8'));
  assert.deepEqual(geometries,baseline,'Approved main content geometry must remain identical');
  const hashes=JSON.parse(await fs.readFile(`${folder}/preserved-hashes.json`,'utf8'));
  for(const [file,hash]of Object.entries(hashes))assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),hash,file);
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await context.newPage();await page.goto(base+'/');const hero=page.locator('.hero-main img');await hero.evaluate(i=>i.decode());assert.equal(await hero.evaluate(i=>getComputedStyle(i).opacity),'1');assert.match(await hero.evaluate(i=>i.currentSrc),/optimized/);await context.close();
 }
 await fs.writeFile(`${folder}/geometry-${mode}.json`,JSON.stringify(geometries,null,2));
 console.log(`${mode}: geometry, image delivery, footer, no-JS and preservation checks passed`);
}finally{await browser.close();}
