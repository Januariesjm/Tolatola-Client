/**
 * @jest-environment node
 */

/**
 * Tests for the ClickPesa payment client (lib/clickpesa.ts).
 *
 * This is the money path, so the behaviors pinned here are: the auth token is
 * cached and reused, every payment previews before it initiates, a failed
 * preview never initiates, and provider error messages are surfaced rather than
 * swallowed.
 */

const ORIGINAL_ENV = {
  CLICKPESA_API_URL: process.env.CLICKPESA_API_URL,
  CLICKPESA_CLIENT_ID: process.env.CLICKPESA_CLIENT_ID,
  CLICKPESA_API_KEY: process.env.CLICKPESA_API_KEY,
}

const BASE = "https://clickpesa.test"

/**
 * lib/clickpesa.ts reads its config into module-level consts at load time, and
 * ES imports are hoisted above any assignment here -- so the module has to be
 * required lazily, after the env is in place.
 */
type ClickPesaClientCtor = typeof import("@/lib/clickpesa").ClickPesaClient
let ClickPesaClient: ClickPesaClientCtor

beforeAll(() => {
  process.env.CLICKPESA_API_URL = BASE
  process.env.CLICKPESA_CLIENT_ID = "test-client-id"
  process.env.CLICKPESA_API_KEY = "test-api-key"
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ClickPesaClient = require("@/lib/clickpesa").ClickPesaClient
})

type Call = { url: string; init: RequestInit | undefined }

let calls: Call[]
let fetchMock: jest.Mock

/** Queues responses in order; each entry maps to one fetch call. */
function queueResponses(responses: Array<{ ok?: boolean; body?: unknown }>) {
  let i = 0
  fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init })
    const r = responses[i++] ?? { ok: true, body: {} }
    return {
      ok: r.ok ?? true,
      status: (r.ok ?? true) ? 200 : 400,
      json: async () => r.body ?? {},
    } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
}

const TOKEN_RESPONSE = { ok: true, body: { success: true, token: "tok-abc" } }
const PAYMENT_RESULT = {
  ok: true,
  body: { success: true, transaction_id: "txn-1", status: "PENDING", message: "ok" },
}

beforeEach(() => {
  calls = []
  jest.clearAllMocks()
})

afterAll(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe("getAuthToken", () => {
  it("posts the client credentials as headers and returns the token", async () => {
    queueResponses([TOKEN_RESPONSE])
    const client = new ClickPesaClient()

    await expect(client.getAuthToken()).resolves.toBe("tok-abc")

    expect(calls[0].url).toBe(`${BASE}/third-parties/generate-token`)
    expect(calls[0].init?.method).toBe("POST")
    expect(calls[0].init?.headers).toEqual({
      "client-id": "test-client-id",
      "api-key": "test-api-key",
    })
  })

  it("caches the token across calls instead of re-authenticating", async () => {
    queueResponses([TOKEN_RESPONSE])
    const client = new ClickPesaClient()

    await client.getAuthToken()
    await client.getAuthToken()
    await client.getAuthToken()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("does not share a cached token between client instances", async () => {
    queueResponses([TOKEN_RESPONSE, TOKEN_RESPONSE])

    await new ClickPesaClient().getAuthToken()
    await new ClickPesaClient().getAuthToken()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("throws when the provider rejects the credentials", async () => {
    queueResponses([{ ok: false, body: { message: "bad creds" } }])

    await expect(new ClickPesaClient().getAuthToken()).rejects.toThrow(
      "Failed to generate ClickPesa token",
    )
  })
})

describe("initiateMobileMoneyPayment", () => {
  it("previews before initiating and returns the initiate response", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: true, body: {} }, PAYMENT_RESULT])
    const client = new ClickPesaClient()

    const result = await client.initiateMobileMoneyPayment(
      5000,
      "255700000001",
      "m-pesa",
      "ref-1",
      "https://app.test/callback",
    )

    expect(calls.map((c) => c.url)).toEqual([
      `${BASE}/third-parties/generate-token`,
      `${BASE}/payment/ussd-push/preview`,
      `${BASE}/payment/ussd-push/initiate`,
    ])
    expect(result).toEqual(PAYMENT_RESULT.body)
  })

  it("sends the merchant reference and callback only on initiate", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: true, body: {} }, PAYMENT_RESULT])

    await new ClickPesaClient().initiateMobileMoneyPayment(
      5000,
      "255700000001",
      "m-pesa",
      "ref-1",
      "https://app.test/callback",
    )

    const preview = JSON.parse(String(calls[1].init?.body))
    const initiate = JSON.parse(String(calls[2].init?.body))

    expect(preview).toEqual({ phone_number: "255700000001", amount: 5000, provider: "M_PESA" })
    expect(initiate).toEqual({
      phone_number: "255700000001",
      amount: 5000,
      provider: "M_PESA",
      merchant_reference: "ref-1",
      callback_url: "https://app.test/callback",
    })
  })

  it("authorizes both payment calls with the bearer token", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: true, body: {} }, PAYMENT_RESULT])

    await new ClickPesaClient().initiateMobileMoneyPayment(
      100,
      "255700000001",
      "airtel-money",
      "ref",
      "https://cb",
    )

    for (const call of calls.slice(1)) {
      expect(call.init?.headers).toMatchObject({ Authorization: "tok-abc" })
    }
  })

  it("does not initiate when the preview fails, and surfaces the provider message", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: false, body: { message: "insufficient funds" } }])

    await expect(
      new ClickPesaClient().initiateMobileMoneyPayment(
        5000,
        "255700000001",
        "m-pesa",
        "ref-1",
        "https://cb",
      ),
    ).rejects.toThrow("insufficient funds")

    expect(calls.map((c) => c.url)).not.toContain(`${BASE}/payment/ussd-push/initiate`)
  })

  it("falls back to a generic message when the provider sends no message", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: false, body: {} }])

    await expect(
      new ClickPesaClient().initiateMobileMoneyPayment(1, "255", "m-pesa", "r", "https://cb"),
    ).rejects.toThrow("Failed to preview mobile money payment")
  })

  it("surfaces an initiate failure after a successful preview", async () => {
    queueResponses([
      TOKEN_RESPONSE,
      { ok: true, body: {} },
      { ok: false, body: { message: "provider timeout" } },
    ])

    await expect(
      new ClickPesaClient().initiateMobileMoneyPayment(1, "255", "m-pesa", "r", "https://cb"),
    ).rejects.toThrow("provider timeout")
  })

  it.each([
    ["m-pesa", "M_PESA"],
    ["airtel-money", "AIRTEL_MONEY"],
    ["halopesa", "HALOPESA"],
    ["ezypesa", "EZYPESA"],
  ])("maps provider %s to %s", async (provider, expected) => {
    queueResponses([TOKEN_RESPONSE, { ok: true, body: {} }, PAYMENT_RESULT])

    await new ClickPesaClient().initiateMobileMoneyPayment(
      1,
      "255",
      provider as "m-pesa",
      "r",
      "https://cb",
    )

    expect(JSON.parse(String(calls[1].init?.body)).provider).toBe(expected)
  })

  // KNOWN BUG, pinned deliberately rather than silently changed.
  //
  // The provider name is built with `provider.toUpperCase().replace("-", "_")`.
  // String.replace with a string pattern replaces only the FIRST match, so the
  // one provider with two hyphens comes out half-converted:
  //   "mixx-by-yas" -> "MIXX_BY-YAS"   (almost certainly should be MIXX_BY_YAS)
  //
  // Every other provider has a single hyphen and is unaffected. Fixing this
  // changes the payload sent to a live payment provider, so it needs someone
  // who can confirm the value ClickPesa expects. This test documents current
  // behavior; update it together with the fix.
  it("mis-maps mixx-by-yas, replacing only the first hyphen (known bug)", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: true, body: {} }, PAYMENT_RESULT])

    await new ClickPesaClient().initiateMobileMoneyPayment(
      1,
      "255",
      "mixx-by-yas",
      "r",
      "https://cb",
    )

    expect(JSON.parse(String(calls[1].init?.body)).provider).toBe("MIXX_BY-YAS")
  })
})

describe("initiateCardPayment", () => {
  it("previews without the merchant reference, then initiates with it", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: true, body: {} }, PAYMENT_RESULT])

    const result = await new ClickPesaClient().initiateCardPayment(
      25000,
      "4111111111111111",
      "12/28",
      "123",
      "visa",
      "ref-card",
      "https://cb",
    )

    expect(calls.map((c) => c.url)).toEqual([
      `${BASE}/third-parties/generate-token`,
      `${BASE}/payment/card/preview`,
      `${BASE}/payment/card/initiate`,
    ])
    expect(JSON.parse(String(calls[1].init?.body))).toEqual({
      card_number: "4111111111111111",
      expiry_date: "12/28",
      cvv: "123",
      amount: 25000,
    })
    expect(JSON.parse(String(calls[2].init?.body))).toEqual({
      card_number: "4111111111111111",
      expiry_date: "12/28",
      cvv: "123",
      amount: 25000,
      merchant_reference: "ref-card",
      callback_url: "https://cb",
    })
    expect(result).toEqual(PAYMENT_RESULT.body)
  })

  it("does not initiate when the card preview is declined", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: false, body: { message: "card declined" } }])

    await expect(
      new ClickPesaClient().initiateCardPayment(
        1,
        "4111111111111111",
        "12/28",
        "123",
        "visa",
        "r",
        "https://cb",
      ),
    ).rejects.toThrow("card declined")

    expect(calls.map((c) => c.url)).not.toContain(`${BASE}/payment/card/initiate`)
  })

  it("falls back to a generic message on a declined preview with no message", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: false, body: {} }])

    await expect(
      new ClickPesaClient().initiateCardPayment(1, "4111", "12/28", "1", "visa", "r", "https://cb"),
    ).rejects.toThrow("Failed to preview card payment")
  })

  it("surfaces an initiate failure after a successful preview", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: true, body: {} }, { ok: false, body: {} }])

    await expect(
      new ClickPesaClient().initiateCardPayment(1, "4111", "12/28", "1", "visa", "r", "https://cb"),
    ).rejects.toThrow("Failed to initiate card payment")
  })
})

describe("queryPaymentStatus", () => {
  it("GETs the transaction and returns the parsed body", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: true, body: { status: "SUCCESS" } }])

    await expect(new ClickPesaClient().queryPaymentStatus("txn-9")).resolves.toEqual({
      status: "SUCCESS",
    })

    expect(calls[1].url).toBe(`${BASE}/payment/query?transaction_id=txn-9`)
    expect(calls[1].init?.method).toBe("GET")
  })

  it("throws when the query fails", async () => {
    queueResponses([TOKEN_RESPONSE, { ok: false, body: {} }])

    await expect(new ClickPesaClient().queryPaymentStatus("txn-9")).rejects.toThrow(
      "Failed to query payment status",
    )
  })
})
