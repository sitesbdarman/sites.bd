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
  const label = loggedIn
    ? `Open dashboard${fullName ? ` for ${fullName}` : ""}`
    : "Log in or sign up";

  return (
    <Link
      href={loggedIn ? "/dashboard" : "/login"}
      aria-label={label}
      title={loggedIn ? "Dashboard" : "Login / Sign up"}
      className="group relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-sky-50 to-blue-100 text-blue-600 shadow-md ring-1 ring-blue-200/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 sm:h-12 sm:w-12"
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserIcon className="h-6 w-6 transition group-hover:scale-105" />
      )}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/70" />
    </Link>
  );
}
