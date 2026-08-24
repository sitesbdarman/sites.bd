import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "SITES.BD",
  description: "Free subdomains, domains, hosting, DNS management and support."
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <>
    <nav className="nav">
      <div className="container navin">
        <Link className="brand" href="/">🌐 SITES.BD</Link>
        <div className="navlinks">
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/admin/pricing">Admin</Link>
        </div>
      </div>
    </nav>
    {children}
    <footer className="footer">
      <div className="container">
        <div className="footergrid">
          <div><h2 style={{color:"#fff"}}>🌐 SITES.BD</h2><p>A simple home for free subdomains, domains, hosting, DNS management and support.</p></div>
          <div><h3>Services</h3><p>Free Subdomains</p><p>Domain Search</p><p>DNS Management</p></div>
          <div><h3>Support</h3><p>Contact Us</p><p>Support Tickets</p><p>Customer Login</p></div>
          <div><h3>Platform</h3><p>Hosting</p><p>Cart</p><p>Dashboard</p></div>
        </div>
        <div className="credit">© 2026 SITES.BD. All rights reserved.<br/><br/>Developed by <a href="https://www.facebook.com/rafahimn" target="_blank" rel="noopener noreferrer">RA Fahim</a></div>
      </div>
    </footer>
  </>;
}
