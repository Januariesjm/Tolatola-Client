/**
 * Tests for AgentCommissionTab (components/agent/agent-commission-tab.tsx).
 *
 * Covers the paths that move money: loading the wallet, the withdrawal
 * validation branches, and the fee/payout figures shown before the agent
 * confirms. The arithmetic itself is unit-tested in
 * __tests__/lib/agent/wallet.test.ts; this asserts the component wires it up.
 */

import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AgentCommissionTab } from "@/components/agent/agent-commission-tab"
import { setErrorReporter, type LogRecord } from "@/lib/logger"
import type { AgentCommissionRecord } from "@/lib/types/agent"

const mockToast = jest.fn()
jest.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const mockGetSession = jest.fn()
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession: mockGetSession } }),
}))

/** Labels lifted from the component so a copy change fails loudly here. */
const WITHDRAW_TRIGGER = /Kutoa Salio$/
const SUBMIT = /Thibitisha Utoaji/
const AMOUNT_PLACEHOLDER = "Mfano: 10000"
const PHONE_PLACEHOLDER = "Mfano: 0754123456"

const WALLET = {
  lifetimeEarnings: 90000,
  pendingBalance: 20000,
  withdrawableBalance: 50000,
  paidBalance: 70000,
  commissions: [
    { id: "c-1", amount: 30000, status: "paid", created_at: "2026-02-01T00:00:00Z" },
    { id: "c-2", amount: "20000", status: "pending", created_at: "2026-02-02T00:00:00Z" },
  ] as AgentCommissionRecord[],
  withdrawals: [],
}

let reported: LogRecord[]

/** Routes the wallet GET and the withdrawal POST separately. */
function mockFetch(opts: { walletOk?: boolean; withdrawBody?: unknown; withdrawOk?: boolean } = {}) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if ((init?.method || "GET").toUpperCase() === "POST") {
      return { ok: opts.withdrawOk ?? true, json: async () => opts.withdrawBody ?? { success: true } } as Response
    }
    if (String(input).includes("/agents/wallet")) {
      return { ok: opts.walletOk ?? true, json: async () => ({ success: true, wallet: WALLET }) } as Response
    }
    return { ok: true, json: async () => ({}) } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

const props = {
  commissions: [] as AgentCommissionRecord[],
  summary: { totalEarnings: 1000, pendingCommission: 500, paidCommission: 500 },
  leaderboard: [],
  myRank: 3,
}

beforeEach(() => {
  jest.clearAllMocks()
  reported = []
  setErrorReporter((record) => reported.push(record))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  mockGetSession.mockResolvedValue({ data: { session: { access_token: "tok" } } })
  mockFetch()
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

const renderTab = (over: Partial<typeof props> = {}) => render(<AgentCommissionTab {...props} {...over} />)

/**
 * Opens the withdrawal modal.
 *
 * The trigger is disabled until the fetched wallet reports a withdrawable
 * balance, so this waits for the load rather than clicking a dead button.
 */
async function openWithdrawModal() {
  const trigger = await screen.findByRole("button", { name: WITHDRAW_TRIGGER })
  await waitFor(() => expect(trigger).toBeEnabled())
  await userEvent.click(trigger)
  await screen.findByText("Kutoa Salio Kutoka Kwenye Wallet")
}

const amountInput = () => screen.getByPlaceholderText(AMOUNT_PLACEHOLDER)
const phoneInput = () => screen.getByPlaceholderText(PHONE_PLACEHOLDER)
const submitButton = () => screen.getByRole("button", { name: SUBMIT })
const postCalls = (fetchMock: jest.Mock) => fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")

describe("AgentCommissionTab", () => {
  describe("loading the wallet", () => {
    it("requests the wallet with the session token", async () => {
      const fetchMock = mockFetch()
      renderTab()

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("/agents/wallet"),
          expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok" }) }),
        ),
      )
    })

    it("renders the withdrawable balance the wallet returns", async () => {
      renderTab()

      await waitFor(() => expect(screen.getAllByText(/50,000/).length).toBeGreaterThan(0))
    })

    it("keeps the server-rendered balances when the wallet request fails", async () => {
      mockFetch({ walletOk: false })

      renderTab({
        commissions: [{ id: "s-1", amount: 7777, status: "paid", created_at: "2026-02-01T00:00:00Z" }] as AgentCommissionRecord[],
      })

      // The commission passed from the server still drives the totals; the
      // failed request must not blank them.
      await waitFor(() => expect(screen.getAllByText(/7,777/).length).toBeGreaterThan(0))
      expect(screen.queryByText(/50,000/)).not.toBeInTheDocument()
    })

    it("cannot open a withdrawal when the wallet never loads a withdrawable balance", async () => {
      mockFetch({ walletOk: false })

      renderTab()

      const trigger = await screen.findByRole("button", { name: WITHDRAW_TRIGGER })
      await waitFor(() => expect(trigger).toBeDisabled())
    })

    it("logs and stops loading when the session lookup throws", async () => {
      mockGetSession.mockRejectedValue(new Error("supabase down"))

      renderTab()

      await waitFor(() => expect(reported.map((record) => record.message)).toContain("failed to load wallet stats"))
      expect(reported[0].error?.message).toBe("supabase down")
    })
  })

  describe("withdrawal validation", () => {
    it("keeps submit disabled until an amount above zero is entered", async () => {
      renderTab()
      await openWithdrawModal()

      expect(submitButton()).toBeDisabled()

      await userEvent.type(amountInput(), "0")
      expect(submitButton()).toBeDisabled()

      await userEvent.clear(amountInput())
      await userEvent.type(amountInput(), "1000")
      expect(submitButton()).toBeEnabled()
    })

    it("still rejects a non-positive amount if the form is submitted anyway", async () => {
      const fetchMock = mockFetch()
      renderTab()
      await openWithdrawModal()

      // The submit button is disabled for an empty amount, so this exercises the
      // handler's own guard directly — defence in depth, not a reachable click.
      fireEvent.submit(submitButton().closest("form") as HTMLFormElement)

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Kosa la Uingizaji", variant: "destructive" })),
      )
      expect(postCalls(fetchMock)).toHaveLength(0)
    })

    it("rejects an amount above the withdrawable balance", async () => {
      const fetchMock = mockFetch()
      renderTab()
      await openWithdrawModal()

      await userEvent.type(amountInput(), "999999")
      // A valid phone is needed to get this far at all: the field is `required`,
      // so native form validation blocks submission before the handler runs.
      await userEvent.type(phoneInput(), "0754123456")
      await userEvent.click(submitButton())

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Salio Halitoshi", variant: "destructive" })),
      )
      expect(postCalls(fetchMock)).toHaveLength(0)
    })

    it("rejects a short phone number", async () => {
      const fetchMock = mockFetch()
      renderTab()
      await openWithdrawModal()

      await userEvent.type(amountInput(), "1000")
      await userEvent.type(phoneInput(), "1234")
      await userEvent.click(submitButton())

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Namba ya Simu Inahitajika", variant: "destructive" })),
      )
      expect(postCalls(fetchMock)).toHaveLength(0)
    })
  })

  describe("fee preview", () => {
    it("shows the 10% fee and the net payout for the entered amount", async () => {
      renderTab()
      await openWithdrawModal()

      await userEvent.type(amountInput(), "10000")

      // Fee 1,000 and net payout 9,000 of a 10,000 gross.
      await waitFor(() => expect(screen.getAllByText(/-TZS 1,000/).length).toBeGreaterThan(0))
      expect(screen.getAllByText(/TZS 9,000/).length).toBeGreaterThan(0)
    })
  })

  describe("successful withdrawal", () => {
    it("posts the coerced amount with the payment details and confirms", async () => {
      const fetchMock = mockFetch({ withdrawBody: { success: true } })
      renderTab()
      await openWithdrawModal()

      await userEvent.type(amountInput(), "10000")
      await userEvent.type(phoneInput(), "0754123456")
      await userEvent.click(submitButton())

      await waitFor(() => expect(postCalls(fetchMock)).toHaveLength(1))

      const [url, init] = postCalls(fetchMock)[0] as [string, RequestInit]
      expect(url).toContain("/agents/withdrawals/request")
      // amount is a number, not the input's string.
      expect(JSON.parse(String(init.body))).toEqual({ amount: 10000, paymentMethod: "m-pesa", paymentDetails: "0754123456" })

      await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Ombi Limepokelewa!" })))
    })

    it("closes the modal and clears the form after a successful withdrawal", async () => {
      mockFetch({ withdrawBody: { success: true } })
      renderTab()
      await openWithdrawModal()

      await userEvent.type(amountInput(), "10000")
      await userEvent.type(phoneInput(), "0754123456")
      await userEvent.click(submitButton())

      await waitFor(() => expect(screen.queryByText("Kutoa Salio Kutoka Kwenye Wallet")).not.toBeInTheDocument())
    })

    it("does not confirm when the request is rejected by the server", async () => {
      mockFetch({ withdrawOk: false, withdrawBody: { success: false, message: "limit reached" } })
      renderTab()
      await openWithdrawModal()

      await userEvent.type(amountInput(), "10000")
      await userEvent.type(phoneInput(), "0754123456")
      await userEvent.click(submitButton())

      await waitFor(() => expect(mockToast).toHaveBeenCalled())
      expect(mockToast).not.toHaveBeenCalledWith(expect.objectContaining({ title: "Ombi Limepokelewa!" }))
      // The modal stays open so the agent can retry.
      expect(screen.getByText("Kutoa Salio Kutoka Kwenye Wallet")).toBeInTheDocument()
    })
  })
})
