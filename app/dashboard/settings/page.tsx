import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/app/profile/ProfileForm";
import { NotificationPreferences } from "./notification-preferences";
import { IdentityVerification } from "./identity-verification";

export default async function SettingsPage() {
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
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-sky-900 p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Account</p>
        <h1 className="mt-2 text-3xl font-black">Settings</h1>
        <p className="mt-2 text-sm text-slate-300">Manage your profile details and notification preferences in one place.</p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-black text-slate-950">Profile</h2>
        <ProfileForm
          userId={user.id}
          email={profile?.email ?? user.email ?? ""}
          initialFullName={profile?.full_name ?? ""}
          initialMobileNumber={profile?.mobile_number ?? ""}
          initialAddress={address}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
      </div>

      <IdentityVerification />

      <NotificationPreferences />
    </section>
  );
}
