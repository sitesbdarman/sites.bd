"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();

  const label = language === "en" ? "বাংলায় দেখুন" : "Switch to English";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
        className="h-[18px] w-[18px]"
      >
        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3c2.2 2.4 3.4 5.6 3.4 9s-1.2 6.6-3.4 9c-2.2-2.4-3.4-5.6-3.4-9s1.2-6.6 3.4-9Z"
        />
      </svg>
    </button>
  );
}
