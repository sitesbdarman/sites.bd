"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ClaimModal } from "@/components/domains/ClaimModal";

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

export default function DomainSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [claimTarget, setClaimTarget] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimOutcomes, setClaimOutcomes] = useState<Record<string, ClaimOutcome>>({});

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q")?.trim();
    if (!initialQuery) return;

    setQuery(initialQuery);
    setState("loading");
    setErrorMessage(null);

    (async () => {
      try {
        const response = await fetch(`/api/domains/check?query=${encodeURIComponent(initialQuery)}`);
        const data: CheckResponse = await response.json();

        if (!response.ok || !data.success) {
          setState("error");
          setErrorMessage(data.error ?? "Something went wrong. Please try again.");
          setResults([]);
          return;
        }

        setResults(data.results ?? []);
        setIsMock(Boolean(data.mock));
        setState("success");
      } catch {
        setState("error");
        setErrorMessage("Couldn't reach the server. Please check your connection and try again.");
        setResults([]);
      }
    })();
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

    if (state === "loading") {
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setState("error");
      setErrorMessage("Enter at least one domain to search.");
      return;
    }

    setState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/domains/check?query=${encodeURIComponent(trimmed)}`);
      const data: CheckResponse = await response.json();

      if (!response.ok || !data.success) {
        setState("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        setResults([]);
        return;
      }

      setResults(data.results ?? []);
      setIsMock(Boolean(data.mock));
      setState("success");
    } catch {
      setState("error");
      setErrorMessage("Couldn't reach the server. Please check your connection and try again.");
      setResults([]);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center p-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Check Your Domain Name</h1>
          <p className="mt-2 text-gray-500">
            Search again here or view the domain you searched from the homepage.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="domain-query" className="sr-only">
              Domain name
            </label>
            <input
              id="domain-query"
              name="domain-query"
              type="text"
              placeholder="example.com"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={state === "loading"}
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            />
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
            {state === "loading" ? "Searching..." : "Search"}
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400">
          Search up to 5 domains at once, separated by commas or spaces.
        </p>
        <div className="mt-3 text-center text-sm">
          <a href="/" className="font-semibold text-blue-600 hover:text-blue-700">← Back to homepage</a>
        </div>

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
            Availability shown below is placeholder demo data — no real registry has been
            checked yet.
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
                        {result.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    {result.available ? (
                      outcome?.kind === "added" ? (
                        <span className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                          Added to cart
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setClaimTarget(result.domain)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Claim
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
                        Whois
                      </button>
                    )}
                  </div>

                  {outcome?.kind === "error" && (
                    <p role="alert" className="text-xs text-red-600">
                      {outcome.message}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {state === "success" && results.length === 0 && (
          <p className="mt-6 text-center text-sm text-gray-500">No results found.</p>
        )}
      </div>

      {claimTarget && (
        <ClaimModal
          domain={claimTarget}
          submitting={claiming}
          onCancel={() => setClaimTarget(null)}
          onConfirm={handleClaimConfirm}
        />
      )}
    </main>
  );
}
