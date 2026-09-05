import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
    <DashboardLayout
      pageTitle="Settings"
      userEmail={user.email ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      fullName={profile?.full_name ?? null}
    >
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500">Manage your profile details and notification preferences in one place.</p>
          <Link href="/dashboard/notifications" className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700">
            View notifications →
          </Link>
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
    </DashboardLayout>
  );
}
