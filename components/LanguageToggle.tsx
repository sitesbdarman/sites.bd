"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={language === "en" ? "বাংলায় দেখুন" : "Switch to English"}
      className={`flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 ${className}`}
    >
      <span className={language === "en" ? "text-blue-600" : "text-gray-400"}>EN</span>
      <span className="text-gray-300">/</span>
      <span className={language === "bn" ? "text-blue-600" : "text-gray-400"}>বাং</span>
    </button>
  );
}
