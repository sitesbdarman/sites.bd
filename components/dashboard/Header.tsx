import { AccountMenu } from "@/components/AccountMenu";
import { MenuIcon } from "./icons";

interface HeaderProps {
  pageTitle: string;
  userEmail: string | null;
  avatarUrl?: string | null;
  fullName?: string | null;
  onOpenSidebar: () => void;
}

export function Header({ pageTitle, userEmail, avatarUrl, fullName, onOpenSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:hidden"
      >
        <MenuIcon className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </button>

      <h1 className="min-w-0 flex-1 truncate text-base font-black tracking-tight text-slate-950 sm:text-lg">
        {pageTitle}
      </h1>

      {/* Everything that used to be separate icons (notifications, cart, logout) now
          lives inside one dropdown behind the avatar, so the header stays uncluttered. */}
      <AccountMenu loggedIn={Boolean(userEmail)} avatarUrl={avatarUrl} fullName={fullName} email={userEmail} showLabel />
    </header>
  );
}
