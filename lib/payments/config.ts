export type PaymentMode = "simulation" | "production";

export function getPaymentMode(): PaymentMode {
  return process.env.PAYMENT_MODE === "production" ? "production" : "simulation";
}

export const PAYMENT_GATEWAY_NAME = process.env.PAYMENT_GATEWAY_NAME || "Simulation Gateway";
