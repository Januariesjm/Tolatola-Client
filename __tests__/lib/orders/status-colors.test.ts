/**
 * Tests for the order/payment status badge colours
 * (lib/orders/status-colors.ts).
 *
 * These were closures inside a 694-line component. The behaviour that matters
 * is the fallback: the originals called `.toLowerCase()` on the raw status, so
 * an order with a null status crashed the page instead of rendering a grey
 * badge.
 */

import { getPaymentStatusColor, getStatusColor } from "@/lib/orders/status-colors"

const FALLBACK = "bg-gray-100 text-gray-600 border-gray-200"

describe("getStatusColor", () => {
  it.each([
    ["pending", "yellow"],
    ["confirmed", "blue"],
    ["processing", "purple"],
    ["delivered", "green"],
    ["cancelled", "red"],
    ["refunded", "gray-500"],
  ])("maps %s to a %s badge", (status, hue) => {
    expect(getStatusColor(status)).toContain(hue)
  })

  it.each(["shipped", "dispatched", "in_transit"])("treats %s as in-transit (indigo)", (status) => {
    expect(getStatusColor(status)).toContain("indigo")
  })

  it("distinguishes completed from delivered", () => {
    expect(getStatusColor("completed")).not.toBe(getStatusColor("delivered"))
  })

  it("is case insensitive", () => {
    expect(getStatusColor("DELIVERED")).toBe(getStatusColor("delivered"))
    expect(getStatusColor("In_Transit")).toBe(getStatusColor("in_transit"))
  })

  it.each([[undefined], [null], [""]])("falls back for %p instead of throwing", (status) => {
    expect(() => getStatusColor(status as string | null | undefined)).not.toThrow()
    expect(getStatusColor(status as string | null | undefined)).toBe(FALLBACK)
  })

  it("falls back for an unrecognised status", () => {
    expect(getStatusColor("awaiting_alien_pickup")).toBe(FALLBACK)
  })

  it("always returns a non-empty class string", () => {
    for (const s of ["pending", "delivered", "nonsense", "", null, undefined]) {
      expect(getStatusColor(s as string | null | undefined).length).toBeGreaterThan(0)
    }
  })
})

describe("getPaymentStatusColor", () => {
  it.each([
    ["paid", "green"],
    ["pending", "yellow"],
    ["failed", "red"],
  ])("maps %s to a %s badge", (status, hue) => {
    expect(getPaymentStatusColor(status)).toContain(hue)
  })

  it("is case insensitive", () => {
    expect(getPaymentStatusColor("PAID")).toBe(getPaymentStatusColor("paid"))
  })

  it.each([[undefined], [null], [""], ["refunded"]])("falls back for %p", (status) => {
    expect(getPaymentStatusColor(status as string | null | undefined)).toBe(FALLBACK)
  })
})
