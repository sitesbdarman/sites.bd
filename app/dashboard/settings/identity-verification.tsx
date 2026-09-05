"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ShieldIcon } from "@/components/dashboard/icons";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

interface VerificationState {
  status: "unverified" | "pending" | "verified" | "rejected";
  rejectionReason: string | null;
}

export function IdentityVerification() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<VerificationState>({ status: "unverified", rejectionReason: null });
  const [docType, setDocType] = useState<"nid" | "passport">("nid");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadStatus() {
    try {
      const res = await fetch("/api/profile/verification", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setState({ status: data.status ?? "unverified", rejectionReason: data.rejectionReason ?? null });
    } catch {
      // Silent — card just shows the "unverified" default until it can load.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");
    setSuccess("");
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Please upload a JPG, PNG, WEBP or PDF file.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File must be 8 MB or smaller.");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please choose your NID or Passport file first.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("docType", docType);
      formData.append("file", selectedFile);
      const res = await fetch("/api/profile/verification", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't submit your document.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccess("Submitted! Our team will review it shortly.");
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your document.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="identity-verification">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-950">
        <ShieldIcon className="h-5 w-5 text-blue-600" /> Account Verification
      </h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {loading ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : state.status === "verified" ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">✓</span>
            <div>
              <p className="text-sm font-bold text-emerald-800">Your account is verified</p>
              <p className="mt-0.5 text-xs text-emerald-700">Your NID/Passport has been checked and approved by our team.</p>
            </div>
          </div>
        ) : state.status === "pending" ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">…</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Under review</p>
              <p className="mt-0.5 text-xs text-amber-700">We&rsquo;ve received your document. Our team will verify it soon.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Verify your account with your National ID (NID) or Passport.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Upload a clear photo or scan. Our team will review it and mark your account as verified.
              </p>
              {state.status === "rejected" && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  Your last submission was rejected{state.rejectionReason ? `: ${state.rejectionReason}` : "."} Please upload a clearer document.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                {(["nid", "passport"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDocType(type)}
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                      docType === type ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {type === "nid" ? "NID Card" : "Passport"}
                  </button>
                ))}
              </div>

              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-center transition hover:border-blue-300 hover:bg-blue-50/30">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onFileChange} className="hidden" />
                <span className="text-sm font-semibold text-slate-700">
                  {selectedFile ? selectedFile.name : "Click to choose your NID/Passport file"}
                </span>
                <span className="text-xs text-slate-400">JPG, PNG, WEBP or PDF, up to 8 MB</span>
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-emerald-600">{success}</p>}

              <button
                type="submit"
                disabled={busy || !selectedFile}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Submitting..." : "Submit for verification"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
