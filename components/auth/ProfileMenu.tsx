"use client";

import Link from "next/link";
import Image from "next/image";

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.8-4.1 3.5-6 8-6s7.2 1.9 8 6" />
    </svg>
  );
}

interface ProfileMenuProps {
  loggedIn: boolean;
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
}

export function ProfileMenu({ loggedIn, avatarUrl, fullName, email }: ProfileMenuProps) {
  const label = loggedIn ? `Open dashboard${fullName ? ` for ${fullName}` : ""}` : "Log in or sign up";
  const displayName = loggedIn ? fullName || email || "Account" : "Login";

  return (
    <Link
      href={loggedIn ? "/dashboard" : "/login"}
      aria-label={label}
      title={label}
      className="group flex min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-1.5 py-1.5 text-gray-800 transition-colors hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-[.98]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-50 to-blue-100 text-blue-600 ring-1 ring-blue-200/80 sm:h-10 sm:w-10">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
        ) : (
          <UserIcon className="h-5 w-5 transition group-hover:scale-105 sm:h-6 sm:w-6" />
        )}
      </span>
      <span className="hidden min-w-0 max-w-[7rem] sm:block sm:max-w-[12rem]">
        <span className="block truncate text-xs font-bold text-gray-800 sm:text-sm">{displayName}</span>
        {loggedIn && fullName && email && <span className="hidden truncate text-[11px] text-gray-400 sm:block">{email}</span>}
      </span>
    </Link>
  );
}
