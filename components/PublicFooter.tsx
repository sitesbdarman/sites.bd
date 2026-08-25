import Link from "next/link";
import { DeveloperCredit } from "@/components/DeveloperCredit";

export function PublicFooter() {
  return (
    <footer className="bg-blue-950 px-5 py-12 text-white lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
        <div>
          <h2 className="text-2xl font-extrabold">SITES.BD</h2>
          <p className="mt-4 max-w-sm leading-7 text-gray-400">A simple home for free subdomains, domains, hosting, DNS management and support.</p>
        </div>
        <div><h3 className="font-extrabold">Services</h3><div className="mt-4 space-y-2 text-gray-400"><Link className="block hover:text-white" href="/domains/search">Domain Search</Link><Link className="block hover:text-white" href="/pricing">Pricing</Link><Link className="block hover:text-white" href="/cart">Cart</Link></div></div>
        <div><h3 className="font-extrabold">Support</h3><div className="mt-4 space-y-2 text-gray-400"><Link className="block hover:text-white" href="/contact">Contact Us</Link><Link className="block hover:text-white" href="/dashboard/tickets">Support Tickets</Link><Link className="block hover:text-white" href="/login">Customer Login</Link></div></div>
        <div><h3 className="font-extrabold">Platform</h3><div className="mt-4 space-y-2 text-gray-400"><Link className="block hover:text-white" href="/dashboard">Dashboard</Link><Link className="block hover:text-white" href="/domains/search">Domains</Link><Link className="block hover:text-white" href="/pricing">Pricing</Link></div></div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-8 text-center text-sm text-gray-400">© {new Date().getFullYear()} SITES.BD. All rights reserved.</div>
      <div className="mx-auto mt-5 max-w-7xl text-center"><DeveloperCredit /></div>
    </footer>
  );
}
