"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { useSearchParams } from "next/navigation";

interface WhoisRecord {
  domain: string;
  registrantFullName: string | null;
  registrantEmail: string | null;
  registrationDate: string | null;
  expiryDate: string | null;
}

interface WhoisResponse {
  success: boolean;
  whois?: WhoisRecord;
  error?: string;
  mock?: boolean;
}

type LoadState = "loading" | "error" | "success";

function formatDate(value: string | null): string {
  if (!value) {
    return "Not available";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function WhoisContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain")?.trim() ?? "";

  const [state, setState] = useState<LoadState>("loading");
  const [record, setRecord] = useState<WhoisRecord | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) {
      return;
    }

    let cancelled = false;

    async function loadWhois() {
      setState("loading");
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/domains/whois?domain=${encodeURIComponent(domain)}`);
        const data: WhoisResponse = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.success || !data.whois) {
          setState("error");
          setErrorMessage(data.error ?? "Something went wrong. Please try again.");
          setRecord(null);
          return;
        }

        setRecord(data.whois);
        setIsMock(Boolean(data.mock));
        setState("success");
      } catch {
        if (!cancelled) {
          setState("error");
          setErrorMessage("Couldn't reach the server. Please check your connection and try again.");
          setRecord(null);
        }
      }
    }

    loadWhois();

    return () => {
      cancelled = true;
    };
  }, [domain]);

  // No domain in the URL is a distinct, immediate case — handled at render
  // time rather than via effect + state, since there's nothing to fetch.
  const missingDomain = !domain;
  const effectiveState: LoadState = missingDomain ? "error" : state;
  const effectiveError = missingDomain ? "No domain was specified." : errorMessage;

  return (
    <>
      <PublicNavbar />
      <main className="flex flex-1 flex-col items-center p-6 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">WHOIS lookup</h1>
          {domain && <p className="mt-2 text-gray-500">{domain}</p>}
        </div>

        {effectiveState === "loading" && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <span
              aria-hidden="true"
              className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
            />
            <span className="text-sm text-gray-500">Looking up domain information...</span>
          </div>
        )}

        {effectiveState === "error" && effectiveError && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {effectiveError}
          </div>
        )}

        {effectiveState === "success" && record && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {isMock && (
              <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This information is placeholder demo data — no real WHOIS registry has been
                checked yet.
              </div>
            )}
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Domain Name
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900">{record.domain}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Registrant Full Name
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {record.registrantFullName ?? "Not available"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Registrant Email
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {record.registrantEmail ?? "Not available"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Registration Date
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {formatDate(record.registrationDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Expiry Date
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900">{formatDate(record.expiryDate)}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/domains/search" className="text-sm font-medium text-gray-900 underline">
            Back to Domain Search
          </Link>
        </div>
      </div>
      </main>
      <PublicFooter />
    </>
  );
}
