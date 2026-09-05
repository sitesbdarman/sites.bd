import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/app/dashboard/logout-button";
import { CartBadge } from "./CartBadge";
import { NotificationBell } from "./NotificationBell";
import { MenuIcon, UserIcon } from "./icons";

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

      <div className="flex items-center gap-1.5 sm:gap-3">
        {userEmail && (
          <Link
            href="/profile"
            title="Edit profile"
            className="group flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1.5 sm:px-2 transition hover:bg-blue-50 active:scale-[.98]"
          >
            <span className="flex h-9 w-9 overflow-hidden items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition group-hover:ring-blue-300">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" width={36} height={36} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
            </span>
            <span className="hidden max-w-[8rem] truncate text-xs font-medium sm:block text-gray-600 group-hover:text-blue-700 sm:max-w-[14rem] sm:text-sm">
              {fullName || userEmail}
            </span>
          </Link>
        )}
        <NotificationBell />
        <CartBadge />
        <LogoutButton variant="icon" />
      </div>
    </header>
  );
}
