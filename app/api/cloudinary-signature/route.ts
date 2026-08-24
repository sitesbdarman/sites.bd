import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req:Request){
  try{
    const cloud=process.env.CLOUDINARY_CLOUD_NAME;
    const key=process.env.CLOUDINARY_API_KEY;
    const secret=process.env.CLOUDINARY_API_SECRET;
    if(!cloud||!key||!secret) return NextResponse.json({error:"Cloudinary environment variables are missing."},{status:500});
    const form=await req.formData(); const file=form.get("file");
    if(!(file instanceof File)) return NextResponse.json({error:"No image supplied."},{status:400});
    if(file.size>5*1024*1024) return NextResponse.json({error:"Maximum file size is 5 MB."},{status:400});
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)) return NextResponse.json({error:"Only JPG, PNG or WEBP is allowed."},{status:400});
    const bytes=Buffer.from(await file.arrayBuffer());
    const timestamp=Math.floor(Date.now()/1000);
    const folder="sites-bd/profiles";
    const signature=crypto.createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");
    const body=new FormData(); body.append("file",new Blob([bytes],{type:file.type}),file.name); body.append("api_key",key); body.append("timestamp",String(timestamp)); body.append("folder",folder); body.append("signature",signature);
    const r=await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`,{method:"POST",body});
    const data=await r.json();
    if(!r.ok) return NextResponse.json({error:data?.error?.message||"Cloudinary upload failed."},{status:502});
    return NextResponse.json({secure_url:data.secure_url,public_id:data.public_id});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Upload failed."},{status:500});}
}
