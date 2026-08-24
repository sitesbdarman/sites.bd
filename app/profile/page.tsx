import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, mobile_number, address, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const address =
    profile?.address && typeof profile.address === "object" && "full_address" in profile.address
      ? String((profile.address as { full_address?: unknown }).full_address ?? "")
      : "";

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">SITES.BD</p>
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8">
        <ProfileForm
          userId={user.id}
          email={profile?.email ?? user.email ?? ""}
          initialFullName={profile?.full_name ?? ""}
          initialMobileNumber={profile?.mobile_number ?? ""}
          initialAddress={address}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </main>
  );
}
