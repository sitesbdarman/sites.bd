import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileCompletionForm } from "./ProfileCompletionForm";

interface ProfileRow {
  full_name: string | null;
  mobile_number: string | null;
  profile_status: string;
}

export default async function ProfileCompletionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already guards this route, but a Server Component should
  // never trust that alone — redirect defensively if there's no session.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, mobile_number, profile_status")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  // Already complete — nothing to do here.
  if (profile?.profile_status === "complete") {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Complete your profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Just a few details before you can access your dashboard.
          </p>
        </div>

        <ProfileCompletionForm
          initialFullName={profile?.full_name ?? ""}
          initialMobileNumber={profile?.mobile_number ?? ""}
        />
      </div>
    </main>
  );
}
