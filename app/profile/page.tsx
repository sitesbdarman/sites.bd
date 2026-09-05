import { redirect } from "next/navigation";

// Profile editing now lives inside Settings (/dashboard/settings), so this
// route just forwards old links/bookmarks there instead of keeping a
// second, separately-maintained profile page.
export default function ProfilePage() {
  redirect("/dashboard/settings");
}
