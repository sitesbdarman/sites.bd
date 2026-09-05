import Link from "next/link";
import { BrandMark } from "./BrandMark";

const columns = [
  {
    heading: "Products",
    links: [
      { href: "/domains/search", label: "Domain Search" },
      { href: "/pricing", label: "Hosting & Pricing" },
      { href: "/#claim", label: "Free .sites.bd" },
      { href: "/#features", label: "Features" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/support/knowledge-base", label: "Knowledge Base" },
      { href: "/login", label: "Customer Login" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/cart", label: "Cart" },
      { href: "/dashboard/invoices", label: "Invoices" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-white">
      <div className="page-container py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-8">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <BrandMark className="h-6 w-6" />
              </span>
              <span className="text-xl font-black">SITES<span className="text-sky-300">.BD</span></span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Domains, websites, email and DNS management — designed as one simple platform for the modern web.
            </p>
            <p className="mt-5 text-xs font-semibold text-slate-500">
              Developed by{" "}
              <Link href="https://www.facebook.com/rafahimn" target="_blank" rel="noopener noreferrer" className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white">
                RA Fahim
              </Link>
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-black uppercase tracking-[.14em] text-slate-300">{col.heading}</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-400">
                {col.links.map((link) => (
                  <Link key={link.href} className="block transition-colors hover:text-white" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} SITES.BD. All rights reserved.</span>
          <span>Simple infrastructure for the web.</span>
        </div>
      </div>
    </footer>
  );
}
