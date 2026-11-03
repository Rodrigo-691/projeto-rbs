import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import brandIcon from "@/assets/planeta-atlantida-icon.png.asset.json";

const FALLBACK = "/favicon.png";

/** Planeta Atlântida mark. Falls back to the bundled favicon when the hosted asset is unavailable. */
export function BrandMark({ className, alt = "" }: { className?: string; alt?: string }) {
  const [src, setSrc] = useState(brandIcon.url);
  const ref = useRef<HTMLImageElement>(null);
  // An image that failed before hydration never fires React's onError, so check once on mount.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setSrc(FALLBACK);
  }, []);
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      onError={() => setSrc(FALLBACK)}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
