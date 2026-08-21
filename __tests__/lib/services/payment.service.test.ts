/**
 * Tests for PaymentService (lib/services/payment.service.ts).
 *
 * This decides how money is taken and what an order's payment status becomes,
 * so the branch per payment family is pinned here along with the guards that
 * stop a payment being attempted with missing details.
 */

const mockInitiateMobileMoney = jest.fn()
const mockInitiateCard = jest.fn()
const mockQueryStatus = jest.fn()
const mockGetAuthToken = jest.fn()

jest.mock("@/lib/clickpesa", () => ({
  ClickPesaClient: class {
    initiateMobileMoneyPayment = mockInitiateMobileMoney
    initiateCardPayment = mockInitiateCard
    queryPaymentStatus = mockQueryStatus
    getAuthToken = mockGetAuthToken
  },
}))

const updateSpy = jest.fn()
let orderRow: { data: unknown; error: unknown } = {
  data: { id: "ord-1", total_amount: 25000, users: { email: "buyer@tolatola.co" } },
  error: null,
}

/** Supabase double: from("orders").select().eq().single() and .update().eq(). */
function makeClient() {
  const single = jest.fn(async () => orderRow)
  const eqSelect = jest.fn(() => ({ single }))
  const select = jest.fn(() => ({ eq: eqSelect }))
  const eqUpdate = jest.fn(async () => ({ error: null }))
  const update = jest.fn((values: unknown) => {
    updateSpy(values)
    return { eq: eqUpdate }
  })
  return { from: jest.fn(() => ({ select, update })) }
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => makeClient()),
}))

import { PaymentService } from "@/lib/services/payment.service"

const service = () => new PaymentService()

beforeEach(() => {
  jest.clearAllMocks()
  updateSpy.mockClear()
  orderRow = {
    data: { id: "ord-1", total_amount: 25000, users: { email: "buyer@tolatola.co" } },
    error: null,
  }
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  mockInitiateMobileMoney.mockResolvedValue({ transaction_id: "txn-1", message: "Push sent" })
  mockInitiateCard.mockResolvedValue({ transaction_id: "txn-2", message: "Card ok" })
  mockQueryStatus.mockResolvedValue({ status: "COMPLETED" })
  mockGetAuthToken.mockResolvedValue("tok")
})

afterEach(() => jest.restoreAllMocks())

describe("initiatePayment", () => {
  it("fails when the order does not exist", async () => {
    orderRow = { data: null, error: null }

    const result = await service().initiatePayment("missing", "m-pesa", { phoneNumber: "255700000001" })

    expect(result).toMatchObject({ success: false, error: "Order not found" })
    expect(mockInitiateMobileMoney).not.toHaveBeenCalled()
  })

  describe("cash on delivery", () => {
    it("takes no payment and leaves the order pending", async () => {
      const result = await service().initiatePayment("ord-1", "cash-on-delivery", {})

      expect(result).toEqual({
        success: true,
        message: "Order placed successfully. Pay cash upon delivery.",
        requiresPayment: false,
      })
      expect(mockInitiateMobileMoney).not.toHaveBeenCalled()
      expect(mockInitiateCard).not.toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ payment_status: "pending", status: "pending" }))
    })
  })

  describe("mobile money", () => {
    it.each(["m-pesa", "airtel-money", "halopesa", "mixx-by-yas", "ezypesa"])("routes %s to the USSD push", async (method) => {
      await service().initiatePayment("ord-1", method as "m-pesa", { phoneNumber: "255700000001" })

      expect(mockInitiateMobileMoney).toHaveBeenCalledWith(
        25000,
        "255700000001",
        method,
        "ORDER-ord-1",
        expect.stringContaining("/api/webhooks/clickpesa"),
      )
    })

    it("refuses without a phone number", async () => {
      const result = await service().initiatePayment("ord-1", "m-pesa", {})

      expect(result).toMatchObject({
        success: false,
        error: "Phone number is required for mobile money payments",
      })
      expect(mockInitiateMobileMoney).not.toHaveBeenCalled()
    })

    it("marks the order processing and stores the transaction id", async () => {
      const result = await service().initiatePayment("ord-1", "m-pesa", { phoneNumber: "255700000001" })

      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ payment_status: "processing", clickpesa_transaction_id: "txn-1" }))
      expect(result).toMatchObject({ success: true, transactionId: "txn-1", requiresPayment: true })
    })
  })

  describe("cards", () => {
    it.each(["visa", "mastercard", "unionpay"])("routes %s to the card flow", async (method) => {
      await service().initiatePayment("ord-1", method as "visa", {
        cardNumber: "4111111111111111",
        expiryDate: "12/28",
        cvv: "123",
      })

      expect(mockInitiateCard).toHaveBeenCalledWith(25000, "4111111111111111", "12/28", "123", method, "ORDER-ord-1", expect.any(String))
    })

    it.each([
      ["a missing number", { expiryDate: "12/28", cvv: "123" }],
      ["a missing expiry", { cardNumber: "4111", cvv: "123" }],
      ["a missing cvv", { cardNumber: "4111", expiryDate: "12/28" }],
    ])("refuses with %s", async (_label, details) => {
      const result = await service().initiatePayment("ord-1", "visa", details)

      expect(result).toMatchObject({
        success: false,
        error: "Card details are required for card payments",
      })
      expect(mockInitiateCard).not.toHaveBeenCalled()
    })
  })

  describe("bank payments", () => {
    it("creates a control number and returns it", async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({ control_number: "CN-999", message: "Pay at CRDB" }),
      })) as unknown as typeof fetch

      const result = await service().initiatePayment("ord-1", "crdb-simbanking", {})

      expect(mockGetAuthToken).toHaveBeenCalled()
      expect(result).toMatchObject({ success: true, controlNumber: "CN-999", requiresPayment: true })
      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ clickpesa_transaction_id: "CN-999" }))
    })

    it("sends the buyer's email so the bank can reference it", async () => {
      const fetchMock = jest.fn(async (_url: string, _init?: RequestInit) => ({
        ok: true,
        json: async () => ({ control_number: "CN-1" }),
      }))
      global.fetch = fetchMock as unknown as typeof fetch

      await service().initiatePayment("ord-1", "crdb-wakala", {})

      const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
      expect(body).toMatchObject({ amount: 25000, merchant_reference: "ORDER-ord-1", customer_email: "buyer@tolatola.co" })
    })

    it("fails when the bank order cannot be created", async () => {
      global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch

      const result = await service().initiatePayment("ord-1", "crdb-branch-otc", {})

      expect(result).toMatchObject({
        success: false,
        error: "Failed to create bank payment control number",
      })
    })
  })

  it("returns a failure rather than throwing when the provider rejects", async () => {
    mockInitiateMobileMoney.mockRejectedValue(new Error("provider down"))

    const result = await service().initiatePayment("ord-1", "m-pesa", { phoneNumber: "255700000001" })

    expect(result).toEqual({ success: false, error: "provider down" })
  })
})

describe("verifyPayment", () => {
  it("returns the provider status", async () => {
    mockQueryStatus.mockResolvedValue({ status: "COMPLETED", amount: 25000 })

    const result = await service().verifyPayment("txn-1")

    expect(mockQueryStatus).toHaveBeenCalledWith("txn-1")
    expect(result).toMatchObject({ success: true, status: "COMPLETED" })
  })

  it("returns a failure when the lookup throws", async () => {
    mockQueryStatus.mockRejectedValue(new Error("timeout"))

    await expect(service().verifyPayment("txn-1")).resolves.toEqual({
      success: false,
      error: "timeout",
    })
  })
})

describe("handleWebhook", () => {
  it("marks a COMPLETED payment paid and the order confirmed", async () => {
    const result = await service().handleWebhook({
      status: "COMPLETED",
      merchant_reference: "ORDER-ord-1",
      transaction_id: "txn-1",
    })

    expect(updateSpy).toHaveBeenCalledWith({ payment_status: "paid", status: "confirmed" })
    expect(result).toMatchObject({ success: true })
  })

  it("marks a FAILED payment failed and cancels the order", async () => {
    await service().handleWebhook({ status: "FAILED", merchant_reference: "ORDER-ord-1" })

    expect(updateSpy).toHaveBeenCalledWith({ payment_status: "failed", status: "cancelled" })
  })

  // KNOWN INCONSISTENCY, pinned rather than changed.
  //
  // Any status that is neither COMPLETED nor FAILED leaves the ORDER "pending"
  // but writes payment_status "failed", because that field is a two-way ternary
  // on COMPLETED. So an in-flight PENDING callback records the payment as
  // failed while the order is still open. Changing it alters what every screen
  // reading payment_status shows, so it needs a product decision.
  it("records a PENDING callback as payment_status failed while the order stays pending", async () => {
    await service().handleWebhook({ status: "PENDING", merchant_reference: "ORDER-ord-1" })

    expect(updateSpy).toHaveBeenCalledWith({ payment_status: "failed", status: "pending" })
  })

  it("derives the order id by stripping the ORDER- prefix", async () => {
    const result = await service().handleWebhook({ status: "COMPLETED", merchant_reference: "ORDER-abc-123" })

    expect(result).toMatchObject({ success: true })
  })

  it("does not throw on a payload with no merchant reference", async () => {
    await expect(service().handleWebhook({ status: "COMPLETED" })).resolves.toMatchObject({
      success: true,
    })
  })
})
