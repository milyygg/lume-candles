import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const base=process.env.LUME_CHECK_URL||'http://localhost:3015/lume-candles';
const label=process.argv[2]||'local';
const browser=await chromium.launch({channel:'msedge'});
try{
 const page=await browser.newPage();await page.goto(base+'/catalog/');await page.locator('.product-card').first().waitFor();
 const routes=await page.locator('.product-photo').evaluateAll(links=>links.map(a=>new URL(a.href).pathname));assert.equal(routes.length,40);
 const photos=new Set();for(const route of [...routes,...['/','/catalog/','/cart/','/checkout/','/about/','/delivery/','/payment/','/contacts/','/privacy/','/terms/'].map(p=>new URL(base+p).pathname)]){
  const response=await page.request.get(new URL(route,base).href);assert.equal(response.status(),200,route);
  const html=await response.text();assert.match(html,/class="developer-credit"/);assert.match(html,/href="https:\/\/t.me\/milyy_gg" target="_blank" rel="noopener noreferrer"/);
  if(route.includes('/catalog/')&&!route.endsWith('/catalog/')){
   const image=html.match(/\/photography\/optimized\/(MEDIA-\d+)-studio-\d+\.avif/);assert(image,route);photos.add(image[1]);
  }
 }
 assert.equal(photos.size,40);
 const manifest=JSON.parse(await fs.readFile('src/data/optimized-photography.json','utf8'));
 for(const [id,photo]of Object.entries(manifest)){
  const variant=photo.variants.find(v=>v.width>=640)||photo.variants.at(-1);
  for(const format of ['webp','avif']){const response=await page.request.get(base+variant[format]);assert.equal(response.status(),200,id);assert.match(response.headers()['content-type'],new RegExp(`image/${format}`));}
 }
 const hashes=JSON.parse(await fs.readFile('docs/final-optimization/preserved-hashes.json','utf8'));
 for(const [file,hash]of Object.entries({...JSON.parse(await fs.readFile('docs/client-redesign/preservation-before.json','utf8')),...hashes}))assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),hash,file);
 const result={url:base,checkedAt:new Date().toISOString(),pages:50,productPages:40,studioPhotos:40,originalPhotos:40,assetRequests:160,footerOnEveryPage:true,sourceAndShortcutHashesUnchanged:true};
 await fs.writeFile(`docs/final-optimization/assets-${label}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
