"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CUSTOM_CONNECTION_PLAN_ID,
  formatBDT,
  getHostingPlanById,
  getHostingPlansByType,
  type HostingPlan,
  type HostingPlanType,
} from "@/lib/hosting/plans";
import { loadHostingSelection, saveHostingSelection } from "@/lib/hosting/selection";

const TABS: { type: HostingPlanType; label: string }[] = [
  { type: "premium", label: "Premium Hosting" },
  { type: "free", label: "Free Hosting" },
  { type: "custom", label: "Custom Connection" },
];

/** Loose IPv4/IPv6-ish check — good enough to catch empty/garbage input here. */
function isLikelyValidIp(value: string): boolean {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  return ipv4.test(value.trim()) || (value.includes(":") && ipv6.test(value.trim()));
}

function billingLabel(plan: HostingPlan): string {
  if (plan.price === 0) return "Free";
  switch (plan.billingCycle) {
    case "yearly":
      return `${formatBDT(plan.price)}/year`;
    case "monthly":
      return `${formatBDT(plan.price)}/month`;
    case "one_time":
      return `${formatBDT(plan.price)} one-time`;
    default:
      return formatBDT(plan.price);
  }
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: HostingPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full flex-col items-start gap-1 rounded-xl border p-4 text-left shadow-sm transition-colors ${
        selected
          ? "border-gray-900 bg-gray-900/[0.03] ring-1 ring-gray-900"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="font-medium text-gray-900">
          {plan.name}
          {plan.configurable && (
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Configurable
            </span>
          )}
        </span>
        <span className="shrink-0 text-sm font-semibold text-gray-900">{billingLabel(plan)}</span>
      </div>
      {plan.description && <p className="text-xs text-gray-500">{plan.description}</p>}
    </button>
  );
}

export function HostingSelectionContent() {
  const router = useRouter();
  // Lazy-initialized so a prior selection (e.g. user hit Back from a later
  // step) is restored on first render rather than via a setState-in-effect.
  const [initial] = useState(() => loadHostingSelection());
  const [activeTab, setActiveTab] = useState<HostingPlanType>(initial?.type ?? "premium");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => {
    if (!initial) return null;
    return initial.type === "custom" ? CUSTOM_CONNECTION_PLAN_ID : initial.planId;
  });
  const [nameServer, setNameServer] = useState(initial?.custom?.nameServer ?? "");
  const [ipAddress, setIpAddress] = useState(initial?.custom?.ipAddress ?? "");
  const [touchedCustom, setTouchedCustom] = useState(false);

  const [livePlans, setLivePlans] = useState<HostingPlan[]>(() => []);
  useEffect(() => { fetch("/api/catalog?kind=hosting", { cache: "no-store" }).then(r=>r.json()).then(d=>{ if(Array.isArray(d.items)&&d.items.length) setLivePlans(d.items.map((p:any)=>({id:String(p.id),type:p.type,name:p.name,price:Number(p.price||0),billingCycle:p.billing_cycle,description:p.description||"",configurable:true}))); }).catch(()=>{}); }, []);
  const fallbackPlans = useMemo(() => getHostingPlansByType("premium").concat(getHostingPlansByType("free")), []);
  const catalogPlans = livePlans.length ? livePlans : fallbackPlans;
  const premiumPlans = catalogPlans.filter(p=>p.type === "premium");
  const freePlans = catalogPlans.filter(p=>p.type === "free");

  const customValid =
    nameServer.trim().length > 0 && ipAddress.trim().length > 0 && isLikelyValidIp(ipAddress);

  const canContinue =
    activeTab === "custom" ? customValid : selectedPlanId !== null && selectedPlanId !== CUSTOM_CONNECTION_PLAN_ID;

  function handleTabChange(tab: HostingPlanType) {
    setActiveTab(tab);
    setSelectedPlanId(tab === "custom" ? CUSTOM_CONNECTION_PLAN_ID : null);
  }

  function handleContinue() {
    if (!canContinue) return;

    if (activeTab === "custom") {
      saveHostingSelection({
        type: "custom",
        planId: CUSTOM_CONNECTION_PLAN_ID,
        planName: "Custom Connection",
        price: 0,
        billingCycle: "n_a",
        custom: { nameServer: nameServer.trim(), ipAddress: ipAddress.trim() },
      });
    } else {
      const plan = selectedPlanId ? (livePlans.find(p=>p.id===selectedPlanId) || getHostingPlanById(selectedPlanId)) : undefined;
      if (!plan) return;
      saveHostingSelection({
        type: plan.type,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
      });
    }

    // Next checkout step (add-ons) isn't built yet — routing target only.
    router.push("/checkout/addons");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Step 1 of 4</p>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">Choose your hosting</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick a hosting plan for your domain. You can change add-ons in the next step.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 sm:inline-flex sm:w-fit" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.type}
            onClick={() => handleTabChange(tab.type)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4 ${
              activeTab === tab.type
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "premium" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {premiumPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlanId === plan.id}
              onSelect={() => setSelectedPlanId(plan.id)}
            />
          ))}
        </div>
      )}

      {activeTab === "free" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {freePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlanId === plan.id}
              onSelect={() => setSelectedPlanId(plan.id)}
            />
          ))}
        </div>
      )}

      {activeTab === "custom" && (
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-gray-500">
            Point this domain to your own server. This connection is free.
          </p>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-700">Name Server</span>
              <input
                type="text"
                value={nameServer}
                onChange={(e) => setNameServer(e.target.value)}
                onBlur={() => setTouchedCustom(true)}
                placeholder="ns1.example.com"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-700">IP Address</span>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                onBlur={() => setTouchedCustom(true)}
                placeholder="203.0.113.10"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
              />
              {touchedCustom && ipAddress.length > 0 && !isLikelyValidIp(ipAddress) && (
                <span className="text-xs text-red-600">Enter a valid IP address.</span>
              )}
            </label>
            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-500">Price</span>
              <span className="font-medium text-gray-900">৳0 BDT</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <Link
          href="/cart"
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
