"use client";

import { useState } from "react";

interface ClaimModalProps {
  domain: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation modal shown before a domain is added to the cart. The
 * Continue button stays disabled until the Terms & Conditions checkbox is
 * checked. `submitting` is driven by the parent (which owns the actual
 * add-to-cart request) so this component never talks to the API itself.
 */
export function ClaimModal({ domain, submitting, onCancel, onConfirm }: ClaimModalProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        role="presentation"
        onClick={submitting ? undefined : onCancel}
        className="absolute inset-0 bg-gray-900/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-modal-title"
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="claim-modal-title" className="text-lg font-semibold text-gray-900">
          Claim {domain}?
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          This adds <span className="font-medium text-gray-900">{domain}</span> to your cart.
          Availability is re-checked when you claim it, but a domain shown as available now
          isn&apos;t guaranteed to remain so until registration is completed at checkout.
        </p>

        <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            disabled={submitting}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
          />
          <span>I have read and agree to the domain registration Terms &amp; Conditions.</span>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!agreed || submitting}
            className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {submitting ? "Adding..." : "Yes, continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
