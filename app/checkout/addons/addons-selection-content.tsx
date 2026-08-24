"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addonServices, formatBDT, type AddonService } from "@/lib/hosting/addons";
import { loadAddonsSelection, saveAddonsSelection } from "@/lib/hosting/addons-selection";

function AddonCard({
  addon,
  selected,
  onToggle,
}: {
  addon: AddonService;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`flex w-full flex-col items-start gap-1 rounded-xl border p-4 text-left shadow-sm transition-colors ${
        selected
          ? "border-gray-900 bg-gray-900/[0.03] ring-1 ring-gray-900"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="font-medium text-gray-900">{addon.name}</span>
        <span className="shrink-0 text-sm font-semibold text-gray-900">
          {addon.price > 0 ? formatBDT(addon.price) : "Custom"}
        </span>
      </div>
      <p className="text-xs text-gray-500">{addon.description}</p>
    </button>
  );
}

export function AddonsSelectionContent() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const saved = loadAddonsSelection();
    return saved?.addonIds ?? [];
  });

  const noneSelected = selectedIds.length === 0;
  // Valid whenever either "No Additional Service" or at least one real addon is chosen —
  // in this model that's always true, but keep the check explicit for clarity/future rules.
  const canContinue = noneSelected || selectedIds.length > 0;

  function toggleAddon(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectNoAddon() {
    setSelectedIds([]);
  }

  function handleContinue() {
    if (!canContinue) return;
    saveAddonsSelection({ addonIds: selectedIds });
    // Next checkout step (review) isn't built yet — routing target only.
    router.push("/checkout/review");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Step 2 of 4</p>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">Add-on services</h1>
        <p className="mt-1 text-sm text-gray-500">
          Optionally add extra services to your order. You can select more than one.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={selectNoAddon}
          aria-pressed={noneSelected}
          className={`flex w-full flex-col items-start gap-1 rounded-xl border p-4 text-left shadow-sm transition-colors ${
            noneSelected
              ? "border-gray-900 bg-gray-900/[0.03] ring-1 ring-gray-900"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <span className="font-medium text-gray-900">No Additional Service</span>
          <p className="text-xs text-gray-500">Continue with just your domain and hosting.</p>
        </button>

        {addonServices.map((addon) => (
          <AddonCard
            key={addon.id}
            addon={addon}
            selected={selectedIds.includes(addon.id)}
            onToggle={() => toggleAddon(addon.id)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <Link
          href="/checkout/hosting"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Back
        </Link>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
