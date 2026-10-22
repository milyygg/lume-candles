import sharp from 'sharp';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const folder='public/photography/optimized';
await fs.mkdir(folder,{recursive:true});await fs.mkdir('docs/final-optimization',{recursive:true});
const originals=JSON.parse(await fs.readFile('src/data/photography.json','utf8'));
const studio=JSON.parse(await fs.readFile('src/data/studio-photography.json','utf8'));
const manifest={},stats=[];const hashes={};
for(const [kind,photos]of [['studio',studio],['original',originals]])for(const [id,photo]of Object.entries(photos)){
 const input='public'+photo.src;const buffer=await fs.readFile(input);hashes[input]=crypto.createHash('sha256').update(buffer).digest('hex');
 const widths=[...new Set([160,360,640,960,Math.min(1440,photo.width)].filter(w=>w<=photo.width))].sort((a,b)=>a-b);
 const variants=[];
 for(const width of widths){
  const stem=`${id}-${kind}-${width}`;
  const resized=sharp(buffer).rotate().resize({width,withoutEnlargement:true});
  const webp=`/photography/optimized/${stem}.webp`,avif=`/photography/optimized/${stem}.avif`;
  const [w,a]=await Promise.all([resized.clone().webp({quality:86,effort:5}).toFile('public'+webp),resized.clone().avif({quality:63,effort:4,chromaSubsampling:'4:4:4'}).toFile('public'+avif)]);
  variants.push({width,webp,avif});stats.push({id,kind,width,webpBytes:w.size,avifBytes:a.size});
 }
 const blur=await sharp(buffer).resize({width:20}).blur(1).webp({quality:35}).toBuffer();
 manifest[`${id}-${kind}`]={width:photo.width,height:photo.height,placeholder:`data:image/webp;base64,${blur.toString('base64')}`,variants};
 console.log(`${id} ${kind}: ${variants.length} sizes`);
}
await fs.writeFile('src/data/optimized-photography.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile('docs/final-optimization/image-sizes.json',JSON.stringify(stats,null,2));
hashes['Открыть сайт.url']=crypto.createHash('sha256').update(await fs.readFile('Открыть сайт.url')).digest('hex');
await fs.writeFile('docs/final-optimization/preserved-hashes.json',JSON.stringify(hashes,null,2));
console.log('Generated derivatives; source files untouched.');
