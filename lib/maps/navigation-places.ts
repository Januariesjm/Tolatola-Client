import type { NavigationPoint } from "./navigation"

/** A pickup or drop-off with the display/contact details the navigator shows. */
export interface NavigationPlace extends NavigationPoint {
  name: string
  address: string | null
  phone: string | null
}

/** Coerces the API's numeric strings/`null`s into a finite number. */
export function toPoint(value: number | string | null | undefined): number | null {
  // `Number(null)` and `Number("")` are both 0, which would otherwise place a
  // missing coordinate in the Gulf of Guinea instead of being treated as
  // absent by `buildPlace`.
  if (value === null || value === undefined) return null
  if (typeof value === "string" && value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Builds a place only when it has usable coordinates. `0,0` is the API's
 * "missing location" sentinel, so it is treated as absent rather than as a
 * real point in the Gulf of Guinea.
 */
export function buildPlace(
  latitude: number | null,
  longitude: number | null,
  name: string,
  addressParts: Array<string | null | undefined>,
  phone: string | null | undefined,
): NavigationPlace | null {
  if (latitude === null || longitude === null || (latitude === 0 && longitude === 0)) return null
  const address = addressParts.filter(Boolean).join(", ")
  return { latitude, longitude, name, address: address || null, phone: phone || null }
}
