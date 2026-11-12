import originalPhotos from "@/data/photography.json";
import studioPhotos from "@/data/studio-photography.json";
type Photo = {src:string;width:number;height:number};
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export function hasStudioPhoto(source:string) {return !!(studioPhotos as Record<string,Photo>)[source.match(/MEDIA-\d+/)?.[0] || source];}
export function photograph(source:string,original=false):Photo {
 const id=source.match(/MEDIA-\d+/)?.[0] || source;
 const photo=(!original && (studioPhotos as Record<string,Photo>)[id]) || (originalPhotos as Record<string,Photo>)[id] || {src:source,width:1200,height:1500};
 return {...photo,src:base+photo.src};
}
