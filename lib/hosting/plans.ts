/**
 * Hosting plan catalog for Checkout Step 1 (Hosting Selection).
 *
 * Mirrors the shape of `public.hosting_plans` (see database/0001_foundation.sql:
 * name, type, price, billing_cycle, is_active) so this can be swapped for a
 * live Supabase query later without changing consuming components. Kept as
 * static config for now since the Admin Panel (which will manage this table)
 * isn't built yet — this is the single source of truth; do not duplicate
 * these lists elsewhere.
 */

export type HostingPlanType = "premium" | "free" | "custom";
export type BillingCycle = "monthly" | "yearly" | "one_time" | "n_a";

export interface HostingPlan {
  id: string;
  type: HostingPlanType;
  name: string;
  /** Amount in BDT. 0 for free/custom plans. */
  price: number;
  billingCycle: BillingCycle;
  description?: string;
  /** True for packages whose name/price are meant to be admin-configurable later. */
  configurable?: boolean;
}

/** Free tab supports up to this many listed options (currently 4 seeded). */
export const FREE_HOSTING_MAX_OPTIONS = 8;

/** Sentinel plan id representing the Custom Connection option. */
export const CUSTOM_CONNECTION_PLAN_ID = "custom-connection";

export const hostingPlans: HostingPlan[] = [
  // --- Premium ---------------------------------------------------------
  {
    id: "premium-wordpress",
    type: "premium",
    name: "WordPress Hosting",
    price: 1000,
    billingCycle: "yearly",
    description: "Optimized hosting for WordPress sites with 1-click install.",
  },
  {
    id: "premium-cpanel",
    type: "premium",
    name: "cPanel Hosting",
    price: 600,
    billingCycle: "yearly",
    description: "Full cPanel control panel access for general-purpose hosting.",
  },
  {
    id: "premium-business",
    type: "premium",
    name: "Business Hosting",
    price: 1500,
    billingCycle: "yearly",
    description: "Configurable package — name and price are admin-managed.",
    configurable: true,
  },

  // --- Free (max FREE_HOSTING_MAX_OPTIONS) ------------------------------
  {
    id: "free-vercel",
    type: "free",
    name: "Vercel",
    price: 0,
    billingCycle: "n_a",
    description: "Deploy static and serverless projects on Vercel's free tier.",
  },
  {
    id: "free-github-pages",
    type: "free",
    name: "GitHub Pages",
    price: 0,
    billingCycle: "n_a",
    description: "Host a static site directly from a GitHub repository.",
  },
  {
    id: "free-blogger",
    type: "free",
    name: "Blogger",
    price: 0,
    billingCycle: "n_a",
    description: "Google's free blogging platform.",
  },
  {
    id: "free-google-sites",
    type: "free",
    name: "Google Sites",
    price: 0,
    billingCycle: "n_a",
    description: "Simple drag-and-drop site builder from Google.",
  },

  // --- Custom ------------------------------------------------------------
  {
    id: CUSTOM_CONNECTION_PLAN_ID,
    type: "custom",
    name: "Custom Connection",
    price: 0,
    billingCycle: "n_a",
    description: "Point your domain to your own server using a name server and IP address.",
  },
];

export function getHostingPlansByType(type: HostingPlanType): HostingPlan[] {
  return hostingPlans.filter((plan) => plan.type === type);
}

export function getHostingPlanById(id: string): HostingPlan | undefined {
  return hostingPlans.find((plan) => plan.id === id);
}

export function formatBDT(price: number): string {
  return `৳${price.toLocaleString("en-US")} BDT`;
}
