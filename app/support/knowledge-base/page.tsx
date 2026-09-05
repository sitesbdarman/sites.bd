import Link from "next/link";
const faqs=[
["How long does DNS propagation take?","DNS changes can take some time to appear everywhere. Use a public DNS checker to confirm propagation."],
["How do I renew a domain?","Open Dashboard → My Domains → Manage and use the renewal action when your domain is eligible."],
["How do I add a TXT record?","Open a domain and use DNS Records to add the host and value you were given."],
["How do I pay manually?","Open your unpaid invoice and submit the payment transaction details shown in the payment flow."],
];
export default function KnowledgeBase(){return <main className="mx-auto max-w-4xl px-4 py-12"><div className="rounded-3xl bg-slate-950 p-8 text-white"><p className="text-xs font-bold uppercase tracking-wider text-sky-300">Support</p><h1 className="mt-2 text-4xl font-black">Knowledge Base</h1><p className="mt-2 text-slate-300">Quick answers for domains, DNS, billing and renewals.</p></div><div className="mt-6 space-y-3">{faqs.map(([q,a])=><details key={q} className="rounded-[--radius-surface] border border-gray-200 bg-white p-5"><summary className="cursor-pointer font-bold">{q}</summary><p className="mt-3 text-sm leading-6 text-slate-600">{a}</p></details>)}</div><div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard/tickets" className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white">Open a Ticket</Link><a href="https://wa.me/" target="_blank" rel="noreferrer" className="rounded-xl border px-4 py-3 text-sm font-bold">WhatsApp Support</a></div></main>}
