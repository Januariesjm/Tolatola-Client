import { calculateFee } from "@/lib/checkout/delivery"

describe("delivery calculation (lib/checkout/delivery.ts)", () => {
  it("returns 0 if delivery is not available", () => {
    const fee = calculateFee({ rate_per_km: 1000 }, 10, 5, false)
    expect(fee).toBe(0)
  })

  it("returns 0 if distance is less than 0.1 km", () => {
    const fee = calculateFee({ rate_per_km: 1000 }, 0.05, 5, true)
    expect(fee).toBe(0)
  })

  it("calculates fee based on rate_per_kg if defined", () => {
    const method = { rate_per_kg: 2000, rate_per_km: 500 }
    // weight 3 kg * 2000 = 6000
    const fee = calculateFee(method, 10, 3, true)
    expect(fee).toBe(6000)
  })

  it("calculates fee based on rate_per_km if rate_per_kg is 0 or absent", () => {
    const method = { rate_per_km: 500 }
    // distance 12 km * 500 = 6000
    const fee = calculateFee(method, 12, 10, true)
    expect(fee).toBe(6000)
  })

  it("uses distance baseline (<= 5km -> 3000 TZS) when method has no rates", () => {
    const fee = calculateFee(undefined, 4, 1, true)
    expect(fee).toBe(3000)
  })

  it("uses distance baseline (<= 15km -> 5000 TZS) when method has no rates", () => {
    const fee = calculateFee(undefined, 10, 1, true)
    expect(fee).toBe(5000)
  })

  it("uses distance baseline (> 15km -> distance * 500 TZS) when method has no rates", () => {
    const fee = calculateFee(undefined, 20, 1, true)
    expect(fee).toBe(10000)
  })

  it("rounds fee to whole number", () => {
    const method = { rate_per_km: 333.33 }
    const fee = calculateFee(method, 3, 1, true)
    expect(fee).toBe(1000)
  })
})
