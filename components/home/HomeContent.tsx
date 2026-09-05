"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

interface HomeContentProps { loggedIn:boolean; avatarUrl?:string|null; fullName?:string|null; email?:string|null; }

const benefits=[
  ["Free .sites.bd", "Claim a lifetime-free address for your next project."],
  ["Fast domain search", "Search popular extensions and discover alternatives without dead ends."],
  ["Simple management", "Domains, DNS, billing and support in one clear dashboard."],
  ["Built for every screen", "A mobile-first experience that feels native on phones and powerful on desktop."],
  ["Transparent pricing", "Registration, renewal and service costs stay easy to understand."],
  ["Security controls", "Protect important account and domain actions with clear safeguards."],
];

export function HomeContent({loggedIn,avatarUrl,fullName,email}:HomeContentProps){
  const router=useRouter();
  const [domain,setDomain]=useState("");
  const [subdomain,setSubdomain]=useState("");
  const [claiming,setClaiming]=useState(false);
  const [claimMessage,setClaimMessage]=useState<string|null>(null);
  const search=(e:FormEvent)=>{e.preventDefault(); const q=domain.trim(); if(q) router.push(`/domains/search?q=${encodeURIComponent(q)}`)};
  const claim=async(e:FormEvent)=>{
    e.preventDefault(); const label=subdomain.trim().toLowerCase(); if(!label) return setClaimMessage("Enter the name you want before .sites.bd.");
    setClaiming(true); setClaimMessage(null);
    try{ const r=await fetch('/api/subdomains/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label})}); const d=await r.json();
      if(r.status===401){router.push(`/login?next=${encodeURIComponent('/?claim='+label)}`);return}
      setClaimMessage(d.success?`🎉 ${d.domain} is now yours.`:(d.error||'Could not claim this address.'));
      if(d.success) setSubdomain("");
    }catch{setClaimMessage('Network error. Please try again.')} finally{setClaiming(false)}
  };
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <PublicNavbar loggedIn={loggedIn} avatarUrl={avatarUrl} fullName={fullName} email={email}/>
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-4 pb-20 pt-24 text-white sm:pt-28">
      <div className="absolute inset-0 opacity-[.12]" style={{backgroundImage:'radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)',backgroundSize:'32px 32px'}} />
      <div className="page-container relative grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <div className="mb-5 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide backdrop-blur">YOUR ONLINE IDENTITY STARTS HERE</div>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">Find it. Claim it.<br/><span className="text-sky-100">Make it yours.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50 sm:text-xl">Search for a premium domain, or start today with your own free <strong>.sites.bd</strong> address — then manage everything from one beautiful control center.</p>
          <form onSubmit={search} className="mt-8 rounded-[22px] bg-white p-2 shadow-2xl shadow-blue-950/20">
            <div className="flex flex-col gap-2 sm:flex-row"><input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="Search your next domain" className="min-h-14 flex-1 rounded-2xl px-5 text-base font-semibold text-slate-900 outline-none"/><button className="btn-signature min-h-14 rounded-2xl bg-slate-950 px-7 font-black text-white">Search domain →</button></div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-blue-50"><span className="rounded-full bg-white/10 px-3 py-1.5">.com</span><span className="rounded-full bg-white/10 px-3 py-1.5">.net</span><span className="rounded-full bg-white/10 px-3 py-1.5">.org</span><span className="rounded-full bg-white/10 px-3 py-1.5">.io</span></div>
        </div>
        <form onSubmit={claim} className="free-domain-shell rounded-[24px] p-5 text-slate-900 shadow-2xl shadow-blue-950/10 sm:p-7">
          <div className="flex items-center gap-2"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">FREE FOREVER</span><span className="text-xs font-bold text-slate-500">No renewal fee</span></div>
          <h2 className="mt-5 text-2xl font-black sm:text-3xl">Claim your <span className="text-blue-600">.sites.bd</span></h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Your free address can be used as the starting point for your website, portfolio or project.</p>
          <div className="free-domain-input mt-6"><input value={subdomain} onChange={e=>setSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g,''))} placeholder="your-name" aria-label="Free subdomain name"/><span>.sites.bd</span></div>
          <button disabled={claiming} className="btn-signature mt-3 min-h-14 w-full rounded-xl bg-blue-600 px-5 font-black text-white disabled:opacity-60">{claiming?'Claiming…':'Claim free address'}</button>
          {claimMessage&&<p role="status" className="mt-3 rounded-xl bg-white p-3 text-sm font-bold text-slate-700">{claimMessage}</p>}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-500"><div>✓ Free</div><div>✓ Instant</div><div>✓ Managed</div></div>
        </form>
      </div>
    </section>
    <section className="page-container py-14 sm:py-20">
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-black uppercase tracking-[.18em] text-blue-600">Built around the customer</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Everything important. Nothing confusing.</h2></div><Link href="/domains/search" className="font-bold text-blue-600">Explore domain search →</Link></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{benefits.map(([title,text],i)=><article key={title} className="surface accent-bar p-6 pl-8 transition hover:border-blue-200"><div className="text-sm font-black text-blue-600">0{i+1}</div><h3 className="mt-3 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div>
    </section>
    <section className="border-y border-slate-200 bg-white"><div className="page-container grid gap-8 py-14 lg:grid-cols-3"><div><p className="text-sm font-black text-blue-600">A SIMPLE JOURNEY</p><h2 className="mt-2 text-3xl font-black">From search to launch.</h2></div>{[['01','Search','Find a premium domain or check your preferred name.'],['02','Claim or buy','Start free with .sites.bd or purchase the domain you want.'],['03','Manage','Control DNS, services, security, invoices and support.']].map(([n,t,d])=><div key={n}><span className="text-sm font-black text-slate-400">{n}</span><h3 className="mt-2 text-xl font-black">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{d}</p></div>)}</div></section>
    <PublicFooter/>
  </main>
}
