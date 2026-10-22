import {chromium} from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const base=process.env.LUME_CHECK_URL||'http://localhost:3015/lume-candles';
const folder='Презентация для клиентки';await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
const evidence={url:base,capturedAt:new Date().toISOString(),method:'Real Playwright screenshots in original vector device frames. No AI redraw, no third-party mockup assets.'};
try{
 for(const [mobile,viewport,dpr]of [[false,{width:1440,height:900},2],[true,{width:390,height:900},3]]){
  const context=await browser.newContext({viewport,deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});const page=await context.newPage();
  for(const [route,name]of [['/',mobile?'07_Главная_Телефон':'04_Главная_ПК'],['/catalog/',mobile?'08_Каталог_Телефон':'05_Каталог_ПК'],['/catalog/embrace/',mobile?'09_Конструктор_Телефон':'06_Карточка_товара_ПК']]){
   await page.goto(base+route);await page.locator('h1').waitFor();if(route==='/catalog/')await page.locator('.product-card').first().waitFor();
   for(const image of await page.locator('main img:visible').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode());}
   await page.evaluate(async()=>{await document.fonts.ready;scrollTo(0,0);});
   if(mobile&&route.includes('embrace'))await page.locator('.configurator').screenshot({path:`${folder}/${name}.png`});
   else {
    if(mobile && route==='/catalog/')await page.locator('.product-grid').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-32));
    await page.screenshot({path:`${folder}/${name}.png`,fullPage:!mobile && route!=='/'});
   }
  }
  await context.close();
 }
}finally{await browser.close();}
const desktop=(await fs.readFile(`${folder}/04_Главная_ПК.png`)).toString('base64');
const mobile=(await fs.readFile(`${folder}/07_Главная_Телефон.png`)).toString('base64');
const defs=`<defs><radialGradient id="bg"><stop stop-color="#faf7f0"/><stop offset="1" stop-color="#e5dbcd"/></radialGradient><linearGradient id="metal" x2="0" y2="1"><stop stop-color="#e7e5e0"/><stop offset=".48" stop-color="#c6c4be"/><stop offset="1" stop-color="#a4a19c"/></linearGradient><linearGradient id="edge" x2="0" y2="1"><stop stop-color="#f8f6f1"/><stop offset=".5" stop-color="#c7c4bd"/><stop offset="1" stop-color="#8e8b85"/></linearGradient><filter id="soft" x="-60%" y="-80%" width="220%" height="260%"><feGaussianBlur stdDeviation="28"/></filter><filter id="shadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="28" stdDeviation="25" flood-color="#554632" flood-opacity=".2"/></filter></defs>`;
function laptop(x,y,scale){return `<g transform="translate(${x},${y}) scale(${scale})"><ellipse cx="1015" cy="1220" rx="990" ry="52" fill="#65503a" opacity=".22" filter="url(#soft)"/><rect x="140" y="0" width="1752" height="1150" rx="28" fill="url(#edge)" filter="url(#shadow)"/><rect x="147" y="7" width="1738" height="1136" rx="24" fill="#282725"/><circle cx="1016" cy="23" r="4" fill="#535450"/><image href="data:image/png;base64,${desktop}" x="176" y="49" width="1680" height="1050"/><path d="M140 1142H1892L2030 1200Q2038 1220 1995 1230H37Q-5 1220 3 1200Z" fill="url(#metal)"/><path d="M3 1200H2030" stroke="#eeece7" stroke-width="3"/><path d="M822 1144H1210L1225 1157H807Z" fill="#a9a7a0"/><path d="M37 1230H1995" stroke="#89867f" stroke-width="3"/></g>`;}
function phone(x,y,scale){return `<g transform="translate(${x},${y}) scale(${scale})"><ellipse cx="300" cy="1475" rx="300" ry="35" fill="#65503a" opacity=".24" filter="url(#soft)"/><rect x="-4" y="200" width="8" height="72" rx="4" fill="#8c8982"/><rect x="-4" y="300" width="8" height="100" rx="4" fill="#8c8982"/><rect x="596" y="265" width="8" height="135" rx="4" fill="#8c8982"/><rect width="600" height="1460" rx="88" fill="url(#edge)" filter="url(#shadow)"/><rect x="6" y="6" width="588" height="1448" rx="83" fill="#252523"/><rect x="17" y="17" width="566" height="1426" rx="72" fill="#faf8f4"/><rect x="209" y="35" width="182" height="40" rx="20" fill="#222220"/><circle cx="366" cy="55" r="9" fill="#393b39"/><image href="data:image/png;base64,${mobile}" x="17" y="97" width="566" height="1306.15"/><rect x="206" y="1420" width="188" height="6" rx="3" fill="#342d26"/></g>`;}
async function render(name,width,height,content){const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${defs}<rect width="100%" height="100%" fill="url(#bg)"/>${content}</svg>`;await sharp(Buffer.from(svg)).png().toFile(`${folder}/${name}.png`);}
await render('01_Сайт_ПК',2400,1600,laptop(185,160,1));
await render('02_Сайт_Телефон',1440,1800,phone(420,195,1));
await render('03_ПК_и_Телефон',2560,1600,laptop(120,260,1)+phone(1840,205,.86));
await fs.writeFile('docs/final-optimization/presentation.json',JSON.stringify(evidence,null,2));
console.log('9 PNG files created from real screenshots in '+folder);
