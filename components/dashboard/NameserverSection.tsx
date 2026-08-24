"use client";

import { useState } from "react";
import { EmptyState } from "./EmptyState";
import { GlobeIcon } from "./icons";

/**
 * `public.domains` (see database/0002_domains.sql) has no nameserver
 * columns yet — only domain_name, status, auto_renew, registered_at,
 * expires_at, created_at, updated_at. This component intentionally
 * does not invent nameserver1..4 fields or a fake list; it always
 * renders the empty state until a real column/table exists.
 *
 * Kept as a list of plain strings so wiring up real data later (once
 * the schema has it) is a one-line prop change rather than a rewrite.
 */
interface NameserverSectionProps {
  nameservers?: string[];
}

export function NameserverSection({ nameservers = [] }: NameserverSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Nameservers</h2>

      {nameservers.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            icon={GlobeIcon}
            message="Nameserver information is not available yet."
          />
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {nameservers.map((nameserver, index) => (
            <NameserverItem key={nameserver} label={`Nameserver ${index + 1}`} value={nameserver} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface NameserverItemProps {
  label: string;
  value: string;
}

function NameserverItem({ label, value }: NameserverItemProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // Clipboard access can fail (permissions, insecure context, etc.) —
      // fail silently rather than breaking the page.
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="truncate text-sm font-medium text-gray-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </li>
  );
}
