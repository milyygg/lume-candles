import Image from "next/image";
import { photograph } from "@/lib/photography";
export function Photograph({
  source,
  alt,
  priority = false,
  className,
  original = false,
}: {
  source: string;
  alt: string;
  priority?: boolean;
  className?: string;
  original?: boolean;
}) {
  const photo = photograph(source, original);
  return (
    <Image
      src={photo.src}
      width={photo.width}
      height={photo.height}
      alt={alt}
      unoptimized
      priority={priority}
      className={className}
    />
  );
}
