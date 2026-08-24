/**
 * Shared validation schemas for the authentication flow.
 *
 * Framework-agnostic (no "server-only"/"use client" markers) so the same
 * schema can validate on the client for instant feedback AND on the server
 * in route handlers, where the client's validation can never be trusted
 * alone.
 */
import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.");

export const otpCodeSchema = z
  .string()
  .trim()
  .length(6, "Enter the 6-digit code.")
  .regex(/^\d{6}$/, "The code must be 6 digits.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.");

export const mobileNumberSchema = z
  .string()
  .trim()
  .min(1, "Mobile number is required.")
  .regex(/^\+?[0-9]{7,15}$/, "Enter a valid mobile number (digits only, optional +).");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters.")
  .max(120, "Full name is too long.");

export const addressSchema = z
  .string()
  .trim()
  .min(5, "Enter your complete address.")
  .max(500, "Address is too long.");

export const registerSendOtpSchema = z.object({
  email: emailSchema,
});

export const registerVerifyOtpSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
});

export const registerCompleteSchema = z
  .object({
    ticket: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const passwordResetSendOtpSchema = z.object({
  email: emailSchema,
});

export const passwordResetVerifyOtpSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
});

export const passwordResetCompleteSchema = z
  .object({
    ticket: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const profileCompletionSchema = z.object({
  fullName: fullNameSchema,
  mobileNumber: mobileNumberSchema,
  address: addressSchema,
});
