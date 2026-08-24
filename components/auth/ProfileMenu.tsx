"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.1 3.5-6 8-6s7.2 1.9 8 6"/></svg>;
}

export function ProfileMenu({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={loggedIn ? "Open profile menu" : "Login or sign up"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
      >
        <UserIcon className="h-6 w-6" />
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-[60] w-52 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl">
          {loggedIn ? (
            <Link href="/dashboard" className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-700">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <div className="px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Account</div>
              <Link href="/login" className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-700">Log in</Link>
              <Link href="/register" className="block rounded-xl px-4 py-3 text-sm font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-700">Create account</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
