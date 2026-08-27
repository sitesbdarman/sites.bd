import type { SVGProps } from "react";

/**
 * SITES.BD logomark — a globe built from a domain-connection lattice
 * (nodes + orbit lines) rather than a literal 🌐 emoji, so it renders
 * identically across every OS/browser and matches the icon system.
 */
export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="13.5" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="16" cy="16" rx="13.5" ry="5.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M16 2.5v27" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="16" cy="16" r="2.75" fill="currentColor" />
      <circle cx="16" cy="2.5" r="1.5" fill="currentColor" />
      <circle cx="27.5" cy="16" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="29.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
