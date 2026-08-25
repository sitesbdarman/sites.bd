import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "@/components/home/HomeContent";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: { avatar_url: string | null; full_name: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return <HomeContent loggedIn={Boolean(user)} avatarUrl={profile?.avatar_url} fullName={profile?.full_name} />;
}
