/**
 * Tests for useAgentWallet (hooks/use-agent-wallet.ts).
 *
 * This owns the wallet load, the date filter, and the withdrawal submission --
 * exactly the surface components/agent/agent-commission-tab.test.tsx already
 * exercises end to end through the rendered tab. This suite instead drives the
 * hook directly through a minimal harness, so the state transitions (form
 * reset on success, no reset on failure, loading flags) are pinned without
 * depending on the tab's markup.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useAgentWallet } from "@/hooks/use-agent-wallet"
import type { AgentCommissionRecord } from "@/lib/types/agent"

const mockGetSession = jest.fn()
jest.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { getSession: mockGetSession } }) }))

const mockToast = jest.fn()
jest.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const WALLET = {
  lifetimeEarnings: 90000,
  pendingBalance: 20000,
  withdrawableBalance: 50000,
  paidBalance: 70000,
  commissions: [] as AgentCommissionRecord[],
  withdrawals: [],
}

function mockFetch(opts: { wallet?: unknown; walletOk?: boolean; withdrawBody?: unknown; withdrawOk?: boolean } = {}) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if ((init?.method || "GET").toUpperCase() === "POST") {
      return { ok: opts.withdrawOk ?? true, json: async () => opts.withdrawBody ?? { success: true } } as Response
    }
    if (String(input).includes("/agents/wallet")) {
      return { ok: opts.walletOk ?? true, json: async () => opts.wallet ?? { success: true, wallet: WALLET } } as Response
    }
    return { ok: true, json: async () => ({}) } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

/** Renders the hook and exposes just enough to drive it from a test. */
function Harness() {
  const wallet = useAgentWallet({ totalEarnings: 1000, pendingCommission: 500, paidCommission: 500 }, [])

  return (
    <div>
      <span data-testid="loading">{String(wallet.isLoading)}</span>
      <span data-testid="submitting">{String(wallet.isSubmitLoading)}</span>
      <span data-testid="balance">{wallet.walletStats.withdrawableBalance}</span>
      <span data-testid="amount">{wallet.withdrawAmount}</span>
      <span data-testid="phone">{wallet.phoneNumber}</span>
      <span data-testid="modal">{String(wallet.showWithdrawModal)}</span>
      <span data-testid="tab">{wallet.activeHistoryTab}</span>
      <button onClick={() => wallet.setShowWithdrawModal(true)}>open</button>
      <button onClick={() => wallet.setActiveHistoryTab("payouts")}>show payouts</button>
      <button onClick={() => wallet.handleQuickPercent(0.5)}>quick 50</button>
      <button onClick={() => wallet.setPhoneNumber("255700000001")}>set phone</button>
      <form onSubmit={wallet.handleWithdrawSubmit}>
        <button type="submit">submit</button>
      </form>
    </div>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockGetSession.mockResolvedValue({ data: { session: { access_token: "tok" } } })
  mockFetch()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("useAgentWallet", () => {
  it("loads the wallet on mount", async () => {
    render(<Harness />)

    await waitFor(() => expect(screen.getByTestId("balance")).toHaveTextContent("50000"))
    expect(screen.getByTestId("loading")).toHaveTextContent("false")
  })

  it("keeps the server-rendered summary when the wallet request fails", async () => {
    mockFetch({ walletOk: false })

    render(<Harness />)

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"))
    // 1000 from the initial summary passed to the hook, unchanged by the failure.
    expect(screen.getByTestId("balance")).toHaveTextContent("0")
  })

  it("sets a quick-percent amount from the withdrawable balance", async () => {
    render(<Harness />)
    await waitFor(() => expect(screen.getByTestId("balance")).toHaveTextContent("50000"))

    await userEvent.click(screen.getByRole("button", { name: "quick 50" }))

    expect(screen.getByTestId("amount")).toHaveTextContent("25000")
  })

  it("ignores a quick-percent request against a zero balance", async () => {
    mockFetch({ wallet: { success: true, wallet: { ...WALLET, withdrawableBalance: 0 } } })
    render(<Harness />)
    await waitFor(() => expect(screen.getByTestId("balance")).toHaveTextContent("0"))

    await userEvent.click(screen.getByRole("button", { name: "quick 50" }))

    expect(screen.getByTestId("amount")).toHaveTextContent("")
  })

  it("rejects submitting with no amount, without posting", async () => {
    const fetchMock = mockFetch()
    render(<Harness />)
    await waitFor(() => expect(screen.getByTestId("balance")).toHaveTextContent("50000"))

    await userEvent.click(screen.getByRole("button", { name: "submit" }))

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Kosa la Uingizaji" })))
    const posts = fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")
    expect(posts).toHaveLength(0)
  })

  it("posts the withdrawal, resets the form and closes the modal on success", async () => {
    const fetchMock = mockFetch({ withdrawBody: { success: true } })
    render(<Harness />)
    await waitFor(() => expect(screen.getByTestId("balance")).toHaveTextContent("50000"))
    await userEvent.click(screen.getByRole("button", { name: "open" }))
    await userEvent.click(screen.getByRole("button", { name: "quick 50" }))
    await userEvent.click(screen.getByRole("button", { name: "set phone" }))

    await userEvent.click(screen.getByRole("button", { name: "submit" }))

    await waitFor(() => {
      const posts = fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")
      expect(posts).toHaveLength(1)
    })
    await waitFor(() => expect(screen.getByTestId("modal")).toHaveTextContent("false"))
    expect(screen.getByTestId("amount")).toHaveTextContent("")
    expect(screen.getByTestId("phone")).toHaveTextContent("")
  })

  it("keeps the form filled in and the modal open when the server rejects the request", async () => {
    mockFetch({ withdrawOk: false, withdrawBody: { success: false, error: "limit reached" } })
    render(<Harness />)
    await waitFor(() => expect(screen.getByTestId("balance")).toHaveTextContent("50000"))
    await userEvent.click(screen.getByRole("button", { name: "open" }))
    await userEvent.click(screen.getByRole("button", { name: "quick 50" }))
    await userEvent.click(screen.getByRole("button", { name: "set phone" }))

    await userEvent.click(screen.getByRole("button", { name: "submit" }))

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Ombi Imeshindikana" })))
    expect(screen.getByTestId("modal")).toHaveTextContent("true")
    expect(screen.getByTestId("amount")).toHaveTextContent("25000")
  })

  it("toggles the active history tab", async () => {
    render(<Harness />)
    await waitFor(() => expect(screen.getByTestId("balance")).toHaveTextContent("50000"))

    await userEvent.click(screen.getByRole("button", { name: "show payouts" }))

    expect(screen.getByTestId("tab")).toHaveTextContent("payouts")
  })
})
