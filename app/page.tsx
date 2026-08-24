import Link from "next/link";

const plans = [
  {name:"Free Subdomain", price:"$0", desc:"Forever Free", features:["yourname.sites.bd","Instant activation","Connect to any hosting","Use with Blogger","Automatic DNS updates","24/7 DNS support"]}
];

export default function Home(){
  return <>
    <main>
      <section className="hero">
        <div className="container">
          <h1>Free Subdomain Provider</h1>
          <h2>SITES.BD</h2>
          <p>Get your <b>FREE subdomain</b> instantly! Connect to any hosting, use with Blogger, and start your online journey with zero cost and instant activation.</p>
          <Link className="btn" style={{background:"#fff",color:"#2563eb",display:"inline-block",marginTop:18}} href="#pricing">Get Free Subdomain</Link>
        </div>
      </section>
      <section id="features" className="section">
        <div className="container">
          <h2>Why Choose SITES.BD?</h2>
          <div className="grid">
            {["100% Free","Instant Activation","Any Hosting Support","Easy Management","Secure & Reliable","For Everyone"].map((x,i)=><div className="card" key={x}><h3>{x}</h3><p>Professional, simple and responsive tools for managing your online presence.</p></div>)}
          </div>
        </div>
      </section>
      <section id="pricing" className="section">
        <div className="container">
          <h2 style={{textAlign:"center"}}>Simple Pricing</h2>
          {plans.map(p=><div className="card pricing" key={p.name}><h2>{p.name}</h2><div style={{fontSize:58,fontWeight:800}}>{p.price}</div><p>{p.desc}</p><ul>{p.features.map(f=><li key={f}>{f}</li>)}</ul><Link className="btn" style={{background:"#fff",color:"#2563eb"}} href="/profile">Get Started</Link></div>)}
        </div>
      </section>
    </main>
  </>;
}
