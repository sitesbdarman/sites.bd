import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <div className="min-h-[calc(100vh-68px)]">{children}</div>
      <PublicFooter />
    </div>
  );
}
