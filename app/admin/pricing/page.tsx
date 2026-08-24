"use client";
import {useEffect,useState} from "react";

type Plan={id:string;name:string;price:string;description:string;features:string[]};
const key="sitesbd_admin_pricing";
const initial:Plan[]=[{id:"free",name:"Free Subdomain",price:"0",description:"Forever Free",features:["yourname.sites.bd","Instant activation","Connect to any hosting","Use with Blogger"]}];

export default function PricingAdmin(){
 const [plans,setPlans]=useState<Plan[]>(initial);
 useEffect(()=>{const x=localStorage.getItem(key);if(x)try{setPlans(JSON.parse(x))}catch{}},[]);
 function save(){localStorage.setItem(key,JSON.stringify(plans));alert("Pricing saved locally. Connect this CRUD to Supabase for production admin control.");}
 function update(i:number,k:keyof Plan,v:any){setPlans(p=>p.map((x,n)=>n===i?{...x,[k]:v}:x))}
 return <main><div className="adminbar"><div className="container"><h1>Admin · Pricing Management</h1></div></div><section className="section"><div className="container">
 {plans.map((p,i)=><div className="card" key={p.id}><div className="priceitem"><input value={p.name} onChange={e=>update(i,"name",e.target.value)}/><input value={p.price} onChange={e=>update(i,"price",e.target.value)}/><input value={p.description} onChange={e=>update(i,"description",e.target.value)}/><button className="btn" onClick={()=>setPlans(x=>x.filter((_,n)=>n!==i))}>Remove</button></div><textarea style={{width:"100%",minHeight:90}} value={p.features.join("\n")} onChange={e=>update(i,"features",e.target.value.split("\n"))}/></div>)}
 <button className="btn primary" onClick={()=>setPlans(p=>[...p,{id:crypto.randomUUID(),name:"New Plan",price:"0",description:"",features:[]}])}>Add Plan</button> <button className="btn" onClick={save}>Save Pricing</button>
 </div></section></main>
}
