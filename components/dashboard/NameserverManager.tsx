"use client";
import { useState } from "react";
export function NameserverManager({ domainId, initial }: { domainId: string; initial: string[] }) {
  const [values, setValues] = useState([...initial, "", "", "", ""].slice(0,4));
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); setMessage(""); const nameservers = values.map(v=>v.trim()).filter(Boolean); const r=await fetch(`/api/domains/${domainId}/nameservers`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({nameservers})}); const d=await r.json(); setMessage(r.ok?"Nameservers saved.":d.error??"Could not save nameservers."); setBusy(false); }
  return <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-gray-900">Nameservers</h2><p className="mt-1 text-xs text-gray-500">Enter at least two nameservers supplied by your DNS provider.</p><form onSubmit={save} className="mt-4 space-y-3">{values.map((value,i)=><input key={i} value={value} onChange={e=>setValues(v=>v.map((x,j)=>j===i?e.target.value:x))} placeholder={`Nameserver ${i+1}`} className="block w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />)}<button disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{busy?"Saving…":"Save Nameservers"}</button>{message&&<p className="text-sm text-gray-600">{message}</p>}</form></div>
}
