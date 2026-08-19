/**
 * Delivery fee calculation utilities for checkout.
 * Extracted from checkout-content.tsx to ensure consistency, testability, and remove duplicate logic.
 */

export interface TransportMethodRate {
  id?: string
  name?: string
  rate_per_km?: number | string | null
  rate_per_kg?: number | string | null
}

export function calculateFee(
  method: TransportMethodRate | undefined,
  distanceKm: number,
  weightKg: number,
  isAvailable: boolean
): number {
  if (!isAvailable) return 0
  if (distanceKm < 0.1) return 0

  const rateKm = Number(method?.rate_per_km) || 0
  const rateKg = Number(method?.rate_per_kg) || 0

  let fee = 0
  if (rateKg > 0) {
    fee = weightKg * rateKg
  } else if (rateKm > 0) {
    fee = distanceKm * rateKm
  } else {
    // Fallback to a distance-based baseline only if no method rates are defined
    if (distanceKm <= 5) fee = 3000
    else if (distanceKm <= 15) fee = 5000
    else fee = distanceKm * 500
  }

  return Math.round(fee)
}
