"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "bn";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "sitesbd:lang";

function readInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "bn" ? "bn" : "en";
}

/**
 * Site-wide language toggle (English / বাংলা). Persists to localStorage so
 * the choice survives a reload and navigation between pages. Only public,
 * marketing-facing pages (homepage, domain search) currently read
 * translations from this context — the authenticated dashboard/admin
 * areas are English-only for now and can adopt the same `useLanguage()`
 * hook + a translations entry when they're ready to be translated.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Restore the saved language and keep the document language attribute in sync.
    const initial = readInitialLanguage();
    setLanguageState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Storage unavailable — the toggle still works for this page load.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "bn" : "en");
  }, [language, setLanguage]);

  const value = useMemo(() => ({ language, setLanguage, toggleLanguage }), [language, setLanguage, toggleLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
