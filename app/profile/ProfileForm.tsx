"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  userId: string;
  email: string;
  initialFullName: string;
  initialMobileNumber: string;
  initialAddress: string;
  initialAvatarUrl: string | null;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ProfileForm({
  userId,
  email,
  initialFullName,
  initialMobileNumber,
  initialAddress,
  initialAvatarUrl,
}: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(initialFullName);
  const [mobileNumber, setMobileNumber] = useState(initialMobileNumber);
  const [address, setAddress] = useState(initialAddress);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");
    setSuccess("");

    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Please choose a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Profile picture must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setRemoveAvatar(false);
    setAvatarUrl(URL.createObjectURL(file));
  }

  async function uploadAvatar() {
    if (!selectedFile) return null;

    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error ?? "Profile picture upload failed.");
    }

    return data.avatarUrl as string;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      let avatarUrlToSave: string | null | undefined = undefined;

      if (removeAvatar) {
        avatarUrlToSave = null;
      } else if (selectedFile) {
        avatarUrlToSave = await uploadAvatar();
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          mobileNumber,
          address,
          avatarUrl: avatarUrlToSave,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Couldn't save your profile.");

      setSelectedFile(null);
      setRemoveAvatar(false);
      if (data.avatarUrl !== undefined) setAvatarUrl(data.avatarUrl);
      setSuccess("Profile updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[--radius-surface] border border-gray-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-50 text-blue-600 shadow ring-1 ring-gray-200">
            {avatarUrl && !removeAvatar ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-12 w-12" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c.8-4.1 3.5-6 8-6s7.2 1.9 8 6" />
              </svg>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-gray-900">Profile picture</h2>
            <p className="mt-1 text-sm text-gray-500">JPG, PNG or WEBP. Maximum 5 MB.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {avatarUrl ? "Change picture" : "Add picture"}
              </button>
              {(avatarUrl || selectedFile) && !removeAvatar && (
                <button
                  type="button"
                  onClick={() => {
                    setRemoveAvatar(true);
                    setSelectedFile(null);
                    setAvatarUrl(null);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              className="hidden"
            />
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-gray-800">Email</span>
            <input
              value={email}
              readOnly
              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-500 outline-none"
            />
            <span className="mt-1 block text-xs text-gray-400">Email is managed by your login account.</span>
          </label>

          <label>
            <span className="text-sm font-semibold text-gray-800">Full name</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-gray-800">Mobile number</span>
            <input
              required
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="+8801XXXXXXXXX"
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-gray-800">Address</span>
            <textarea
              required
              rows={4}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-2 w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
