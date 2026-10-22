"use client";
/* eslint-disable @next/next/no-img-element -- Prebuilt picture sources support static hosting. */
import { photograph } from "@/lib/photography";
import optimizedPhotos from "@/data/optimized-photography.json";
type OptimizedPhoto = {width:number;height:number;placeholder:string;variants:{width:number;webp:string;avif:string}[]};
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export function Photograph({
  source,
  alt,
  priority = false,
  className,
  original = false,
  sizes = "(max-width: 600px) 90vw, 45vw",
}: {
  source: string;
  alt: string;
  priority?: boolean;
  className?: string;
  original?: boolean;
  sizes?: string;
}) {
  const photo = photograph(source, original);
  const id = source.match(/MEDIA-\d+/)?.[0] || source;
  const optimized = (optimizedPhotos as Record<string,OptimizedPhoto>)[`${id}-${original ? "original" : "studio"}`];
  const srcSet = (format:"webp"|"avif") => optimized.variants.map(v=>`${base}${v[format]} ${v.width}w`).join(", ");
  const image = (
    <img
      src={optimized ? base + (optimized.variants.find(v=>v.width>=640) || optimized.variants[optimized.variants.length-1]).webp : photo.src}
      srcSet={optimized ? srcSet("webp") : undefined}
      sizes={optimized ? sizes : undefined}
      width={photo.width}
      height={photo.height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
      style={optimized ? {backgroundImage:`url("${optimized.placeholder}")`,backgroundSize:"contain",backgroundPosition:"center",backgroundRepeat:"no-repeat"} : undefined}
      onLoad={event=>{
        // Always visible in SSR and without JS. Cached/hero images never wait for an effect.
        if(!priority && !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          event.currentTarget.animate([{opacity:0.75},{opacity:1}],{duration:180,easing:"cubic-bezier(.22,1,.36,1)"});
      }}
    />
  );
  return (
    optimized ? <picture className="photograph"><source type="image/avif" srcSet={srcSet("avif")} sizes={sizes}/>{image}</picture> : image
  );
}
