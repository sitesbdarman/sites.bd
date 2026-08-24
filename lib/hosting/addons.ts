/**
 * Add-on service catalog for Checkout Step 2 (Add-on Services).
 *
 * Static config for now, same rationale as hosting/plans.ts — single
 * source of truth until an Admin Panel manages these; do not duplicate
 * this list elsewhere.
 */

export interface AddonService {
  id: string;
  name: string;
  description: string;
  /** Amount in BDT. */
  price: number;
}

/** Sentinel id representing "No Additional Service" (mutually exclusive with all addons). */
export const NO_ADDON_ID = "no-addon";

export const addonServices: AddonService[] = [
  {
    id: "ready-made-website",
    name: "Ready-made Website",
    description: "A pre-built website template, customized with your branding and content.",
    price: 3000,
  },
  {
    id: "web-designing",
    name: "Web Designing Services",
    description: "Custom website design and development tailored to your requirements.",
    price: 8000,
  },
  {
    id: "other-service",
    name: "Other Service",
    description: "Any additional service not listed above — discussed with our team after checkout.",
    price: 0,
  },
];

export function getAddonById(id: string): AddonService | undefined {
  return addonServices.find((addon) => addon.id === id);
}

export function formatBDT(price: number): string {
  return `৳${price.toLocaleString("en-US")} BDT`;
}
