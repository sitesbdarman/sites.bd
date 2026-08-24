"use client";

import { useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
}

/**
 * Six separate boxes that behave as one logical OTP value. Kept
 * intentionally simple (plain controlled inputs, no external deps) —
 * pastes are split across boxes and digit entry auto-advances focus.
 */
export function OtpInput({ value, onChange, length = 6, disabled, error }: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  function setDigit(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").replace(/\s/g, "").trimEnd());
  }

  function handleChange(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    const lastChar = raw.slice(-1);

    if (!lastChar) {
      setDigit(index, " ");
      return;
    }

    if (!/\d/.test(lastChar)) {
      return;
    }

    setDigit(index, lastChar);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index].trim() && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div>
      <div className="flex justify-center gap-2" role="group" aria-label="Verification code">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit.trim()}
            onChange={(event) => handleChange(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={`h-12 w-10 rounded-md border text-center text-lg font-semibold outline-none transition-colors focus:ring-2 focus:ring-offset-0 ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-gray-900 focus:ring-gray-200"
            }`}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
