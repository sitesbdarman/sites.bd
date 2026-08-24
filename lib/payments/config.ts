export type PaymentMode = "manual" | "simulation" | "production";

export function getPaymentMode(): PaymentMode {
  if (process.env.PAYMENT_MODE === "production") return "production";
  if (process.env.PAYMENT_MODE === "simulation") return "simulation";
  return "manual";
}

export const PAYMENT_GATEWAY_NAME = process.env.PAYMENT_GATEWAY_NAME || "bKash / Nagad / Rocket (manual review)";
