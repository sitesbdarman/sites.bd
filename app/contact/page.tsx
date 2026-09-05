import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      <PublicNavbar />
      <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 px-5 py-20 text-center text-white lg:py-28">
        <p className="font-bold uppercase tracking-[0.25em] text-blue-100">Contact</p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-6xl">How can we help?</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">Questions about domains, hosting, DNS, orders or payments? Send us a message and our support team can help.</p>
      </section>
      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
            <h2 className="text-2xl font-extrabold">Send us a message</h2>
            <p className="mt-2 text-gray-600">For account-specific issues, please use your support dashboard after signing in.</p>
            <form className="mt-7 space-y-4" action="/dashboard/tickets">
              <input name="name" required placeholder="Your name" className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-blue-500"/>
              <input name="email" type="email" required placeholder="Email address" className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-blue-500"/>
              <select name="topic" className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-blue-500"><option>Domain</option><option>Hosting</option><option>DNS</option><option>Payment</option><option>Technical support</option></select>
              <textarea name="message" required rows={6} placeholder="Tell us what you need help with" className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-blue-500"/>
              <Link href="/dashboard/tickets" className="block rounded-xl bg-blue-600 py-4 text-center font-extrabold text-white hover:bg-blue-700">Open Support Center</Link>
            </form>
          </div>
          <div className="space-y-5">
            <div className="rounded-3xl bg-blue-600 p-8 text-white shadow-xl"><h2 className="text-2xl font-extrabold">Support</h2><p className="mt-3 text-white/85">Use your account dashboard to create and track tickets.</p><Link href="/dashboard/tickets" className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-bold text-blue-600">Support Tickets</Link></div>
            <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-gray-100"><h3 className="text-xl font-extrabold">Email</h3><p className="mt-2 text-gray-600">help@sites.bd</p></div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
