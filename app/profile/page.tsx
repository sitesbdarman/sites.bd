"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Profile = { id:string; full_name:string|null; email:string|null; phone:string|null; address:string|null; avatar_url:string|null };

export default function ProfilePage(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [name,setName]=useState(""); const [address,setAddress]=useState(""); const [avatar,setAvatar]=useState("");
  const [msg,setMsg]=useState(""); const [saving,setSaving]=useState(false);

  useEffect(()=>{(async()=>{try{
    const sb=supabase(); const {data:{user}}=await sb.auth.getUser();
    if(!user){setMsg("Please login first.");return;}
    const {data,error}=await sb.from("profiles").select("id,full_name,email,phone,address,avatar_url").eq("id",user.id).single();
    if(error){setMsg(error.message);return;}
    setProfile(data); setName(data.full_name||""); setAddress(data.address||""); setAvatar(data.avatar_url||"");
  }catch(e){setMsg(e instanceof Error?e.message:"Unable to load profile");}})()},[]);

  async function save(){
    if(!profile)return; setSaving(true);setMsg("");
    try{const sb=supabase(); const {error}=await sb.from("profiles").update({full_name:name,address,avatar_url:avatar||null,updated_at:new Date().toISOString()}).eq("id",profile.id);
      if(error) throw error; setMsg("Profile updated successfully.");
    }catch(e){setMsg(e instanceof Error?e.message:"Profile update failed.");}finally{setSaving(false);}
  }

  async function upload(file:File){
    setMsg("Uploading image...");
    const fd=new FormData();fd.append("file",file);
    const res=await fetch("/api/cloudinary-signature",{method:"POST",body:fd});
    const data=await res.json(); if(!res.ok) throw new Error(data.error||"Upload failed");
    setAvatar(data.secure_url); setMsg("Image uploaded. Click Save changes to store it in your profile.");
  }

  return <main className="section"><div className="container"><div className="form">
    <h1>My Profile</h1>
    {msg&&<div className={"notice "+(msg.toLowerCase().includes("success")?"success":msg.toLowerCase().includes("fail")||msg.toLowerCase().includes("error")?"error":"")}>{msg}</div>}
    <div style={{display:"flex",gap:20,alignItems:"center",margin:"25px 0"}}>{avatar?<img src={avatar} alt="Profile" style={{width:100,height:100,borderRadius:"50%",objectFit:"cover",border:"3px solid #e2e8f0"}}/>:<div style={{width:100,height:100,borderRadius:"50%",background:"#e2e8f0",display:"grid",placeItems:"center"}}>👤</div>}<div><b>Profile picture</b><p>JPG, PNG or WEBP. Maximum 5 MB.</p><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)upload(f).catch(x=>setMsg(x.message))}}/></div></div>
    <div className="field"><label>Email</label><input value={profile?.email||""} disabled/></div>
    <div className="row"><div className="field"><label>Full name</label><input value={name} onChange={e=>setName(e.target.value)}/></div><div className="field"><label>Mobile number</label><input value={profile?.phone||""} disabled/></div></div>
    <div className="field"><label>Address</label><textarea rows={5} value={address} onChange={e=>setAddress(e.target.value)}/></div>
    <button className="btn primary" onClick={save} disabled={saving}>{saving?"Saving...":"Save changes"}</button>
  </div></div></main>
}
