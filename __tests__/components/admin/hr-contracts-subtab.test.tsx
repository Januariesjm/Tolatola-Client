/**
 * Tests for HRContractsSubtab (components/admin/hr-contracts-subtab.tsx).
 *
 * A prop-driven contracts list, filterable by staff name or contract type.
 * Adding a contract optionally uploads a document to Supabase storage (the
 * shared client mock from jest.setup.ts resolves that successfully by
 * default) before posting the contract itself; delete is gated behind
 * window.confirm. What's worth pinning: the search filter, the derived
 * pending/active/expired status badge, the upload-then-post sequence (and
 * that a failed upload still lets the contract save with no document), and
 * the delete flow.
 */

// jsdom has no Pointer Capture API, which Radix's Select touches on pointer
// down; polyfilled the same way as __tests__/components/admin/orders-management-tab.test.tsx.
if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
}

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HRContractsSubtab } from "@/components/admin/hr-contracts-subtab"

const mockPost = jest.fn()
const mockDelete = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
  clientApiDelete: (...args: unknown[]) => mockDelete(...args),
}))

const STAFF = [
  { id: "s-1", full_name: "Asha Mwinyi", employee_id: "EMP-001" },
  { id: "s-2", full_name: "Baraka John", employee_id: "EMP-002" },
]

function contract(overrides: Record<string, unknown> = {}) {
  return {
    id: "c-1",
    staff_id: "s-1",
    contract_type: "full-time",
    start_date: "2020-01-01",
    end_date: undefined,
    salary: 500000,
    document_url: undefined,
    hr_staff_records: { full_name: "Asha Mwinyi", employee_id: "EMP-001" },
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(window, "confirm").mockReturnValue(true)
  jest.spyOn(window, "open").mockImplementation(() => null)
  mockPost.mockResolvedValue({ data: { id: "new-c", contract_type: "full-time", start_date: "2026-01-01" } })
  mockDelete.mockResolvedValue({})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("HRContractsSubtab", () => {
  it("shows the empty state when there are no contracts", () => {
    render(<HRContractsSubtab contracts={[]} staff={STAFF} />)

    expect(screen.getByText("No contracts found.")).toBeInTheDocument()
  })

  it("renders a contract's staff, type, duration and salary", () => {
    render(<HRContractsSubtab contracts={[contract()]} staff={STAFF} />)

    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("full time")).toBeInTheDocument()
    expect(screen.getByText(/Indefinite/)).toBeInTheDocument()
    expect(screen.getByText("TZS 500,000")).toBeInTheDocument()
  })

  it("falls back to 'Unknown' and a dash when staff/salary are missing", () => {
    render(<HRContractsSubtab contracts={[contract({ hr_staff_records: undefined, salary: undefined })]} staff={STAFF} />)

    expect(screen.getByText("Unknown")).toBeInTheDocument()
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("filters by staff name or contract type", async () => {
    render(
      <HRContractsSubtab
        contracts={[
          contract(),
          contract({
            id: "c-2",
            staff_id: "s-2",
            contract_type: "intern",
            hr_staff_records: { full_name: "Baraka John", employee_id: "EMP-002" },
          }),
        ]}
        staff={STAFF}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText(/search by staff name/i), "intern")

    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it("shows a 'Pending Start' badge for a contract that starts in the future", () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    render(<HRContractsSubtab contracts={[contract({ start_date: future.toISOString() })]} staff={STAFF} />)

    expect(screen.getByText("Pending Start")).toBeInTheDocument()
  })

  it("shows an 'Expired' badge for a contract whose end date is in the past", () => {
    render(<HRContractsSubtab contracts={[contract({ end_date: "2020-12-31" })]} staff={STAFF} />)

    expect(screen.getByText("Expired")).toBeInTheDocument()
  })

  it("shows an 'Active' badge for a current contract with no end date", () => {
    render(<HRContractsSubtab contracts={[contract()]} staff={STAFF} />)

    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("opens the document in a new tab when 'View' is clicked", async () => {
    render(<HRContractsSubtab contracts={[contract({ document_url: "https://example.test/contract.pdf" })]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: /View/i }))

    expect(window.open).toHaveBeenCalledWith("https://example.test/contract.pdf", "_blank")
  })

  it("deletes a contract when the confirmation is accepted", async () => {
    render(<HRContractsSubtab contracts={[contract()]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: "" }))

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/hr/contracts/c-1"))
    await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
  })

  it("does not delete when the confirmation is declined", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false)
    render(<HRContractsSubtab contracts={[contract()]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: "" }))

    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("submits a new contract without a document and prepends it to the list", async () => {
    mockPost.mockResolvedValue({
      data: { id: "new-c", staff_id: "s-2", contract_type: "full-time", start_date: "2026-01-01" },
    })
    render(<HRContractsSubtab contracts={[contract()]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: /Upload Contract/i }))
    await userEvent.click(screen.getAllByRole("combobox")[0])
    await userEvent.click(await screen.findByRole("option", { name: /Baraka John/ }))
    const startDateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    await userEvent.type(startDateInput, "2026-01-01")
    await userEvent.click(screen.getByRole("button", { name: /Save Contract/i }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "admin/hr/contracts",
        expect.objectContaining({ staff_id: "s-2", contract_type: "full-time", document_url: null }),
      ),
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByText("Baraka John")).toBeInTheDocument()
  })

  it("uploads the selected file to Supabase storage and includes its public URL in the payload", async () => {
    render(<HRContractsSubtab contracts={[]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: /Upload Contract/i }))
    await userEvent.click(screen.getAllByRole("combobox")[0])
    await userEvent.click(await screen.findByRole("option", { name: /Asha Mwinyi/ }))

    const startDateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    await userEvent.type(startDateInput, "2026-01-01")

    const file = new File(["contract body"], "contract.pdf", { type: "application/pdf" })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(fileInput, file)

    await userEvent.click(screen.getByRole("button", { name: /Save Contract/i }))

    // The shared Supabase mock (__tests__/setup/mocks.ts) resolves storage
    // uploads to a fixed public URL.
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("admin/hr/contracts", expect.objectContaining({ document_url: "https://example.test/file" })),
    )
  })

  it("sends a null salary and end_date when they are left blank", async () => {
    render(<HRContractsSubtab contracts={[]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: /Upload Contract/i }))
    await userEvent.click(screen.getAllByRole("combobox")[0])
    await userEvent.click(await screen.findByRole("option", { name: /Asha Mwinyi/ }))

    const startDateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    await userEvent.type(startDateInput, "2026-01-01")
    await userEvent.click(screen.getByRole("button", { name: /Save Contract/i }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("admin/hr/contracts", expect.objectContaining({ end_date: null, salary: null })),
    )
  })
})
