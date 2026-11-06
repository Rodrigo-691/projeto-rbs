import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeToggle";

interface BrandMarkProps {
  className?: string;
  alt?: string;
  /** Force specific variant. If omitted, follows current theme/surface. */
  variant?: "dark-text" | "white-text" | "auto";
}

/**
 * Planeta Atlântida 2027 logo.
 * Adapts between the version with white text (for dark backgrounds) and dark text (for light backgrounds)
 * so the curved text "PLANETA ATLÂNTIDA 2027" is always crisp, legible and never washed out.
 */
export function BrandMark({ className, alt = "Planeta Atlântida 2027", variant = "auto" }: BrandMarkProps) {
  const [theme] = useTheme();

  // If auto, dark theme gets the white text logo, light theme gets the dark text logo.
  const isWhiteText = variant === "white-text" || (variant === "auto" && theme === "dark");
  const src = isWhiteText ? "/planeta-atlantida-logo-white.png" : "/planeta-atlantida-logo-dark.png";

  return (
    <img
      src={src}
      alt={alt}
      width={512}
      height={512}
      className={cn("shrink-0 aspect-square object-contain", className)}
      loading="eager"
      decoding="async"
    />
  );
}
