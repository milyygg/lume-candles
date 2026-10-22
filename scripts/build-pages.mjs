import { cp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const stage = resolve(root, '.pages-build');
// Only this generated directory is replaced; source and local databases stay intact.
if (stage !== join(root, '.pages-build')) throw new Error('Invalid staging directory');
await rm(stage, { recursive: true, force: true });
await mkdir(stage);
for (const name of ['src', 'public', 'tsconfig.json', 'postcss.config.mjs']) await cp(join(root,name),join(stage,name),{recursive:true});
await rm(join(stage,'src/app/api'),{recursive:true,force:true});
await rm(join(stage,'src/server'),{recursive:true,force:true});
await writeFile(join(stage,'package.json'), JSON.stringify({private:true,type:'module'}));
await writeFile(join(stage,'next.config.ts'), `export default { output:'export', basePath:'/lume-candles', trailingSlash:true, images:{unoptimized:true}, poweredByHeader:false, turbopack:{root:${JSON.stringify(root)}} };`);
async function edit(file, transform) { const path=join(stage,file); await writeFile(path,transform(await readFile(path,'utf8'))); }
await edit('src/components/photograph.tsx',s=>s.replace('src={photo.src}','src={"/lume-candles" + photo.src}'));
await edit('src/app/media-library/page.tsx',s=>s.replace('src={m.preview}','src={"/lume-candles" + m.preview}'));
await edit('src/app/fonts.css',s=>s.replaceAll('url(/fonts/','url(/lume-candles/fonts/'));
await edit('src/app/layout.tsx',s=>s.replace('url: "/media/','url: "/lume-candles/media/').replace('icon: "/icon.svg"','icon: "/lume-candles/icon.svg"'));
for(const file of ['src/app/robots.ts','src/app/sitemap.ts']) await edit(file,s=>'export const dynamic = "force-static";\n'+s);
await writeFile(join(stage,'src/components/checkout.tsx'), `"use client";
import Link from 'next/link';
import {useCart} from './store';
import {money} from '@/lib/config';
export function Checkout(){const cart=useCart(); return <section className="confirmation"><h1>Ваш выбор</h1><p>Демонстрационная версия магазина. Здесь можно выбрать свечи и собрать корзину. Приём и отправка заказов пока не подключены.</p><p>Предварительная стоимость: {money(cart.total)}, без доставки.</p><Link className="button" href="/cart">Вернуться в корзину</Link><p><Link className="text-link" href="/catalog">Продолжить выбор</Link></p></section>}
`);
await edit('src/app/catalog/page.tsx',s=>s.replace(/export default async function CatalogPage[\s\S]*?  return \(/, 'export default function CatalogPage() { return (').replace('<Catalog initialCategory={initialCategory} />','<Suspense fallback={<p>Загружаем коллекцию...</p>}><Catalog /></Suspense>').replace('import type { Metadata }', 'import { Suspense } from "react";\nimport type { Metadata }'));
await edit('src/components/catalog.tsx',s=>s.replace('import { useMemo, useState }', 'import { useSearchParams } from "next/navigation";\nimport { useMemo, useState }').replace('  const [search, setSearch]', '  const query = useSearchParams();\n  initialCategory = query.get("category") || initialCategory;\n  const [search, setSearch]'));
const build = spawnSync(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'build',stage],{stdio:'inherit',env:{...process.env,NEXT_PUBLIC_SITE_URL:'https://milyygg.github.io/lume-candles',ORDER_MODE:'test'}});
if(build.status!==0) process.exit(build.status||1);
await writeFile(join(stage,'out/.nojekyll'),'');
console.log('GitHub Pages files: '+join(stage,'out'));

// Next 16 segment requests use dotted names; provide static aliases on Pages.
async function aliases(dir) {
 for (const entry of await readdir(dir,{withFileTypes:true})) {
  const p=join(dir,entry.name);
  if(entry.isDirectory() && entry.name.startsWith('__next.')) {
   async function flatten(current,parts) { for(const e of await readdir(current,{withFileTypes:true})) { const file=join(current,e.name); if(e.isDirectory()) await flatten(file,[...parts,e.name]); else await cp(file,join(dir,[...parts,e.name].join('.'))); } }
   await flatten(p,[entry.name]);
  } else if(entry.isDirectory() && entry.name!=='_next') await aliases(p);
 }
}
await aliases(join(stage,'out'));
