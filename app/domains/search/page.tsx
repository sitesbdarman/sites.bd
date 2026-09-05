"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClaimModal } from "@/components/domains/ClaimModal";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { useLanguage, type Language } from "@/lib/i18n/LanguageContext";
import { domainSearchText, tr } from "@/lib/i18n/translations";

interface DomainResult {
  domain: string;
  available: boolean;
  status: "available" | "unavailable" | "unknown";
}

interface CheckResponse {
  success: boolean;
  results?: DomainResult[];
  error?: string;
  mock?: boolean;
}

interface CartAddResponse {
  success: boolean;
  guest?: boolean;
  error?: string;
}

type SearchState = "idle" | "loading" | "error" | "success";

/** Per-domain outcome of a claim attempt, shown inline on that row. */
type ClaimOutcome = { kind: "added" } | { kind: "error"; message: string };

const POPULAR_TLDS = ["com", "net", "org", "io", "dev", "co", "app", "xyz"];
const RECENT_SEARCHES_KEY = "domainSearch:recent";
const MAX_RECENT = 6;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  const existing = loadRecentSearches().filter((v) => v !== query);
  const updated = [query, ...existing].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Storage unavailable (private mode, quota) — recent searches just won't persist.
  }
}

/** Base name with any TLD stripped, used to build alternative-name suggestions. */
function baseNameOf(domain: string): string {
  const firstLabel = domain.split(".")[0] ?? domain;
  return firstLabel.toLowerCase();
}

/** Cheap, deterministic alternative names for an unavailable domain — no extra network round trip needed to *propose* them, only to check them. */
function buildAlternativeSuggestions(domain: string): string[] {
  const base = baseNameOf(domain);
  const currentTld = domain.split(".").slice(1).join(".") || "com";
  const otherTlds = POPULAR_TLDS.filter((t) => t !== currentTld).slice(0, 3).map((t) => `${base}.${t}`);
  const prefixed = [`get${base}.com`, `try${base}.com`, `my${base}.com`].filter((d) => d !== domain);
  return Array.from(new Set([...otherTlds, ...prefixed])).slice(0, 5);
}

export default function DomainSearchPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const st = domainSearchText;
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [claimTarget, setClaimTarget] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimOutcomes, setClaimOutcomes] = useState<Record<string, ClaimOutcome>>({});
  const [cartAddedRecently, setCartAddedRecently] = useState<string | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showTldSuggestions, setShowTldSuggestions] = useState(false);
  const [altResults, setAltResults] = useState<Record<string, DomainResult[]>>({});
  const [altLoading, setAltLoading] = useState<Record<string, boolean>>({});
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only API (localStorage) on mount; matches existing prior-query hydration pattern below.
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputWrapperRef.current && !inputWrapperRef.current.contains(event.target as Node)) {
        setShowTldSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tldSuggestions = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.includes(" ") || trimmed.includes(",")) return [];
    const base = trimmed.includes(".") ? trimmed.split(".")[0] : trimmed;
    if (!base) return [];
    return POPULAR_TLDS.map((tld) => `${base}.${tld}`);
  }, [query]);

  async function runSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setState("error");
      setErrorMessage("Enter at least one domain to search.");
      return;
    }

    setState("loading");
    setErrorMessage(null);
    setShowTldSuggestions(false);
    setAltResults({});

    try {
      const response = await fetch(`/api/domains/check?query=${encodeURIComponent(trimmed)}`);
      const data: CheckResponse = await response.json();

      if (!response.ok || !data.success) {
        setState("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        setResults([]);
        return;
      }

      const nextResults = data.results ?? [];
      setResults(nextResults);
      setIsMock(Boolean(data.mock));
      setState("success");
      saveRecentSearch(trimmed);
      setRecentSearches(loadRecentSearches());

      const unavailable = nextResults.filter((item) => !item.available).slice(0, 3);
      for (const item of unavailable) {
        const candidates = buildAlternativeSuggestions(item.domain);
        setAltLoading((prev) => ({ ...prev, [item.domain]: true }));
        void fetch(`/api/domains/check?query=${encodeURIComponent(candidates.join(","))}`)
          .then((response) => response.json() as Promise<CheckResponse>)
          .then((altData) => {
            if (altData.success) setAltResults((prev) => ({ ...prev, [item.domain]: altData.results ?? [] }));
          })
          .catch(() => undefined)
          .finally(() => setAltLoading((prev) => ({ ...prev, [item.domain]: false })));
      }
    } catch {
      setState("error");
      setErrorMessage("Couldn't reach the server. Please check your connection and try again.");
      setResults([]);
    }
  }

  async function loadAlternatives(domain: string) {
    if (altResults[domain] || altLoading[domain]) return;
    setAltLoading((prev) => ({ ...prev, [domain]: true }));
    const candidates = buildAlternativeSuggestions(domain);
    try {
      const response = await fetch(`/api/domains/check?query=${encodeURIComponent(candidates.join(","))}`);
      const data: CheckResponse = await response.json();
      if (response.ok && data.success) {
        setAltResults((prev) => ({ ...prev, [domain]: data.results ?? [] }));
      }
    } catch {
      // Silent — alternatives are a nice-to-have; the main result already rendered.
    } finally {
      setAltLoading((prev) => ({ ...prev, [domain]: false }));
    }
  }

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q")?.trim();
    if (!initialQuery) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the ?q= URL param once on mount to prefill and auto-run the search; there's no external-system value to sync from otherwise.
    setQuery(initialQuery);
    runSearch(initialQuery);
  }, []);

  async function handleClaimConfirm() {
    if (!claimTarget || claiming) {
      return;
    }

    setClaiming(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: claimTarget }),
      });
      const data: CartAddResponse = await response.json();

      if (data.guest) {
        // Guest cart is already persisted server-side (httpOnly cookie) —
        // send them to log in; the cart merges automatically afterwards.
        router.push("/login");
        return;
      }

      if (!response.ok || !data.success) {
        setClaimOutcomes((prev) => ({
          ...prev,
          [claimTarget]: { kind: "error", message: data.error ?? "Couldn't add that domain. Please try again." },
        }));
        setClaimTarget(null);
        return;
      }

      setClaimOutcomes((prev) => ({ ...prev, [claimTarget]: { kind: "added" } }));
      setCartAddedRecently(claimTarget);
      window.dispatchEvent(new Event("sitesbd:cart-updated"));
      setClaimTarget(null);
    } catch {
      setClaimOutcomes((prev) => ({
        ...prev,
        [claimTarget]: {
          kind: "error",
          message: "Couldn't reach the server. Please check your connection and try again.",
        },
      }));
      setClaimTarget(null);
    } finally {
      setClaiming(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "loading") return;
    await runSearch(query);
  }

  return (
    <>
      <PublicNavbar />
      <main className="flex flex-1 flex-col items-center p-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{tr(st.title, language)}</h1>
          <p className="mt-2 text-gray-500">
            {tr(st.subtitle, language)}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2 sm:flex-row">
          <div ref={inputWrapperRef} className="relative flex-1">
            <label htmlFor="domain-query" className="sr-only">
              Domain name
            </label>
            <input
              id="domain-query"
              name="domain-query"
              type="text"
              placeholder={tr(st.searchPlaceholder, language)}
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setShowTldSuggestions(true)}
              disabled={state === "loading"}
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            />

            {showTldSuggestions && tldSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                {tldSuggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setQuery(suggestion);
                        setShowTldSuggestions(false);
                        runSearch(suggestion);
                      }}
                      className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="submit"
            disabled={state === "loading"}
            className="flex items-center justify-center gap-2 rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "loading" && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {state === "loading" ? tr(st.searching, language) : tr(st.searchButton, language)}
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400">
          {tr(st.helperText, language)}
        </p>
        <div className="mt-3 text-center text-sm">
          <Link href="/" className="font-semibold text-blue-600 hover:text-blue-700">{tr(st.backToHome, language)}</Link>
        </div>

        {recentSearches.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-gray-400">{tr(st.recent, language)}</span>
            {recentSearches.map((recent) => (
              <button
                key={recent}
                type="button"
                onClick={() => {
                  setQuery(recent);
                  runSearch(recent);
                }}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                {recent}
              </button>
            ))}
          </div>
        )}

        {state === "error" && errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {isMock && state === "success" && (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {tr(st.mockNotice, language)}
          </div>
        )}

        {state === "success" && results.length > 0 && (
          <ul className="mt-6 flex flex-col gap-3">
            {results.map((result) => {
              const outcome = claimOutcomes[result.domain];
              return (
                <li
                  key={result.domain}
                  className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{result.domain}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          result.available
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {result.available ? tr(st.available, language) : tr(st.unavailable, language)}
                      </span>
                    </div>
                    {result.available ? (
                      outcome?.kind === "added" ? (
                        <span className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                          {tr(st.addedToCart, language)}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setClaimTarget(result.domain)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          {tr(st.claim, language)}
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/domains/whois?domain=${encodeURIComponent(result.domain)}`)
                        }
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        {tr(st.whois, language)}
                      </button>
                    )}
                  </div>

                  {outcome?.kind === "error" && (
                    <p role="alert" className="text-xs text-red-600">
                      {outcome.message}
                    </p>
                  )}

                  {!result.available && (
                    <AlternativeSuggestions
                      domain={result.domain}
                      language={language}
                      loading={Boolean(altLoading[result.domain])}
                      alternatives={altResults[result.domain]}
                      onReveal={() => loadAlternatives(result.domain)}
                      onPick={(alt) => {
                        setQuery(alt);
                        runSearch(alt);
                      }}
                      onClaim={(alt) => setClaimTarget(alt)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {state === "success" && results.length === 0 && (
          <p className="mt-6 text-center text-sm text-gray-500">{tr(st.noResults, language)}</p>
        )}
      </div>

      {cartAddedRecently && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-[--radius-surface] bg-gray-950 px-4 py-3 text-sm font-semibold text-white shadow-[--shadow-float] ring-1 ring-white/10">
          <span className="text-emerald-300">{cartAddedRecently}</span> added to cart.
          <Link href="/cart" className="rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white transition hover:bg-blue-500 active:scale-95">Go to Cart</Link>
          <button type="button" onClick={() => setCartAddedRecently(null)} className="text-gray-400 hover:text-white" aria-label="Dismiss">×</button>
        </div>
      )}

      {claimTarget && (
        <ClaimModal
          domain={claimTarget}
          submitting={claiming}
          onCancel={() => setClaimTarget(null)}
          onConfirm={handleClaimConfirm}
        />
      )}
      </main>
      <PublicFooter />
    </>
  );
}

function AlternativeSuggestions({
  domain,
  language,
  loading,
  alternatives,
  onReveal,
  onPick,
  onClaim,
}: {
  domain: string;
  language: Language;
  loading: boolean;
  alternatives?: DomainResult[];
  onReveal: () => void;
  onPick: (domain: string) => void;
  onClaim: (domain: string) => void;
}) {
  const st = domainSearchText;

  if (!alternatives && !loading) {
    return (
      <button
        type="button"
        onClick={onReveal}
        className="self-start text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        {tr(st.seeSimilar, language)}
      </button>
    );
  }

  if (loading) {
    return <p className="text-xs text-gray-400">{tr(st.checkingSimilar, language)} {domain}…</p>;
  }

  const available = (alternatives ?? []).filter((a) => a.available);
  if (available.length === 0) {
    return <p className="text-xs text-gray-400">{tr(st.noSimilar, language)}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {available.map((alt) => (
        <div
          key={alt.domain}
          className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 py-1 pl-3 pr-1 text-xs"
        >
          <button type="button" onClick={() => onPick(alt.domain)} className="font-medium text-green-800 hover:underline">
            {alt.domain}
          </button>
          <button
            type="button"
            onClick={() => onClaim(alt.domain)}
            className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-green-700 shadow-sm hover:bg-green-100"
          >
            {tr(st.claim, language)}
          </button>
        </div>
      ))}
    </div>
  );
}
