import originalPhotos from "@/data/photography.json";
type Photograph = { src: string; width: number; height: number };
/** Replace one entry after approval of the professional product photograph.
 * Example: 'MEDIA-21': {src:'/photography/embrace-approved.jpg',width:1800,height:2400}
 * Source photographs and product IDs stay unchanged.
 */
const replacements: Record<string, Photograph> = {};
export function photograph(source: string): Photograph {
  const id = source.match(/MEDIA-\d+/)?.[0] || source;
  return (
    replacements[id] ||
    (originalPhotos as Record<string, Photograph>)[id] || {
      src: source,
      width: 1200,
      height: 1500,
    }
  );
}
