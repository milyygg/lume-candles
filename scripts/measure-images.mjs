import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const label = process.argv[2] || 'after';
const base = process.env.LUME_PERF_URL || 'http://localhost:3015/lume-candles';
const folder = 'docs/final-optimization';
await fs.mkdir(folder,{recursive:true});
const browser = await chromium.launch({channel:'msedge'});
const results=[];
try {
 for(const route of (process.env.LUME_PERF_ROUTES || '/,/catalog/').split(',')) for(let run=1;run<=3;run++) {
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const page=await context.newPage();const cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  let active=0,maxConcurrent=0;const pending=new Set();const requests=[];
  cdp.on('Network.requestWillBeSent',e=>{if(e.type==='Image' && e.request.url.startsWith('http')){pending.add(e.requestId);active++;maxConcurrent=Math.max(maxConcurrent,active);requests.push({url:e.request.url,priority:e.request.initialPriority});}});
  let imageBytes=0;
  cdp.on('Network.loadingFinished',e=>{if(pending.delete(e.requestId)){active--;imageBytes+=e.encodedDataLength;}});
  cdp.on('Network.loadingFailed',e=>{if(pending.delete(e.requestId))active--;});
  await page.addInitScript(()=>{
   window.__perf={lcp:0,cls:0,lcpElement:'',firstScreenImages:0};
   new PerformanceObserver(list=>{for(const e of list.getEntries()){window.__perf.lcp=e.startTime;window.__perf.lcpElement=e.element?.tagName+' '+e.element?.className;}}).observe({type:'largest-contentful-paint',buffered:true});
   let start=0,last=0,sum=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput){if(e.startTime-last<1000&&e.startTime-start<5000)sum+=e.value;else{sum=e.value;start=e.startTime;}last=e.startTime;window.__perf.cls=Math.max(sum,window.__perf.cls);}}).observe({type:'layout-shift',buffered:true});
  });
  await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:120000});
  if(route.includes('catalog'))await page.locator('.product-card').first().waitFor({timeout:120000});
  await page.waitForFunction(()=>[...document.querySelectorAll('main img')].filter(i=>{const r=i.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}).every(i=>i.complete&&i.naturalWidth>0),{},{timeout:120000});
  const firstScreenReady=await page.evaluate(()=>performance.now());
  await page.waitForLoadState('networkidle',{timeout:120000});
  await page.waitForTimeout(1000);
  const metrics=await page.evaluate(()=>({...window.__perf,images:[...document.querySelectorAll('main img')].map(i=>({src:i.currentSrc,width:i.clientWidth,naturalWidth:i.naturalWidth,loading:i.loading,priority:i.fetchPriority})),navigation:performance.getEntriesByType('navigation')[0].toJSON()}));
  results.push({label,route,run,profile:{viewport:'390x844',dpr:3,downloadMbps:1.6,uploadMbps:0.75,latencyMs:150,cpuSlowdown:4,cache:'disabled'},lcpMs:metrics.lcp,cls:metrics.cls,lcpElement:metrics.lcpElement,firstScreenReadyMs:firstScreenReady,imageBytes,imageRequests:requests.length,maxConcurrentImageRequests:maxConcurrent,requests,images:metrics.images});
  console.log(JSON.stringify({label,route,run,lcpMs:metrics.lcp,cls:metrics.cls,firstScreenReadyMs:firstScreenReady,imageBytes,maxConcurrent}));
  if(run===1){await page.emulateMedia({reducedMotion:'reduce'});await page.screenshot({path:`${folder}/${label}-${route==='/'?'home':'catalog'}-mobile.png`});}
  await context.close();
 }
} finally {await browser.close();await fs.writeFile(`${folder}/performance-${label}.json`,JSON.stringify(results,null,2));}
