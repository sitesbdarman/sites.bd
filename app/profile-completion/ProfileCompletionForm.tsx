"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/TextField";

interface FormValues {
  fullName: string;
  mobileNumber: string;
  address: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const MOBILE_PATTERN = /^\+?[0-9]{7,15}$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }

  if (!values.mobileNumber.trim()) {
    errors.mobileNumber = "Mobile number is required.";
  } else if (!MOBILE_PATTERN.test(values.mobileNumber.trim())) {
    errors.mobileNumber = "Enter a valid mobile number (digits only, optional +).";
  }

  if (!values.address.trim()) {
    errors.address = "Address is required.";
  } else if (values.address.trim().length < 5) {
    errors.address = "Enter your complete address.";
  }

  return errors;
}

interface ProfileCompletionFormProps {
  initialFullName: string;
  initialMobileNumber: string;
}

export function ProfileCompletionForm({
  initialFullName,
  initialMobileNumber,
}: ProfileCompletionFormProps) {
  const router = useRouter();

  // Mobile number becomes locked forever once set on the server, so if
  // one already exists (e.g. a Google user re-visiting this page after a
  // partial save) show it read-only rather than letting it be re-typed.
  const mobileLocked = initialMobileNumber.trim().length > 0;

  const [values, setValues] = useState<FormValues>({
    fullName: initialFullName,
    mobileNumber: initialMobileNumber,
    address: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleChange(field: keyof FormValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          mobileNumber: values.mobileNumber.trim(),
          address: values.address.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setSubmitError("Couldn't reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {submitError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <TextField
        id="fullName"
        label="Full Name"
        type="text"
        autoComplete="name"
        required
        value={values.fullName}
        onChange={handleChange("fullName")}
        error={errors.fullName}
        disabled={isSubmitting}
      />

      <TextField
        id="mobileNumber"
        label="Mobile Number"
        type="tel"
        autoComplete="tel"
        required
        placeholder="+8801XXXXXXXXX"
        value={values.mobileNumber}
        onChange={handleChange("mobileNumber")}
        error={errors.mobileNumber}
        disabled={isSubmitting || mobileLocked}
      />
      {mobileLocked && (
        <p className="-mt-3 text-xs text-gray-400">Mobile number cannot be changed once set.</p>
      )}

      <TextField
        id="address"
        label="Complete Address"
        type="text"
        autoComplete="street-address"
        required
        value={values.address}
        onChange={handleChange("address")}
        error={errors.address}
        disabled={isSubmitting}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && (
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {isSubmitting ? "Saving..." : "Save and continue"}
      </button>
    </form>
  );
}
