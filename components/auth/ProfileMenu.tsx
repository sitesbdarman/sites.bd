"use client";

import Link from "next/link";

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.8-4.1 3.5-6 8-6s7.2 1.9 8 6" />
    </svg>
  );
}

interface ProfileMenuProps {
  loggedIn: boolean;
  avatarUrl?: string | null;
  fullName?: string | null;
}

export function ProfileMenu({ loggedIn, avatarUrl, fullName }: ProfileMenuProps) {
  const label = loggedIn ? `Open dashboard${fullName ? ` for ${fullName}` : ""}` : "Log in or sign up";

  return (
    <Link
      href={loggedIn ? "/dashboard" : "/login"}
      aria-label={label}
      title={loggedIn ? "Dashboard" : "Login / Sign up"}
      className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <UserIcon className="h-6 w-6" />
      )}
    </Link>
  );
}
