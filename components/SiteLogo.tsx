import type { CSSProperties } from "react";
import { BrandMark } from "@/components/BrandMark";

interface SiteLogoProps {
  logoUrl?: string | null;
  className?: string;
  style?: CSSProperties;
}

/** Renders the admin-uploaded site logo when set, otherwise the default BrandMark glyph. */
export function SiteLogo({ logoUrl, className, style }: SiteLogoProps) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- external/admin-uploaded URL, not a static local asset
    return <img src={logoUrl} alt="" className={`${className ?? ""} object-contain`} style={style} />;
  }
  return <BrandMark className={className} style={style} />;
}
