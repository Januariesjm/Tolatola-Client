/**
 * Tests for TransporterManagementTab and the hook behind it
 * (components/admin/transporter-management-tab.tsx,
 * hooks/use-admin-transporters.ts).
 *
 * Mirrors __tests__/components/admin/vendor-management-tab.test.tsx: this is
 * an admin surface with two destructive actions, so the behaviour worth
 * protecting is that each acts on the transporter that was clicked, that a
 * failure leaves the list alone, and that the details dialog stays in step
 * with the row it was opened from.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TransporterManagementTab } from "@/components/admin/transporter-management-tab"

const mockGet = jest.fn()
const mockPost = jest.fn()
const mockDelete = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockGet(...args),
  clientApiPost: (...args: unknown[]) => mockPost(...args),
  clientApiDelete: (...args: unknown[]) => mockDelete(...args),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))
jest.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))
jest.mock("@/components/admin/message-dialog", () => ({
  AdminMessageDialog: ({ recipientName }: { recipientName: string }) => <div data-testid="msg-dialog">{recipientName}</div>,
}))

const ACTIVE = {
  id: "t-1",
  user_id: "u-1",
  vehicle_type: "bodaboda",
  vehicle_registration: "T123ABC",
  license_number: "LIC-001",
  kyc_status: "approved",
  availability_status: "available",
  is_active: true,
  created_at: "2026-01-05T10:00:00Z",
  updated_at: "2026-01-06T10:00:00Z",
  total_deliveries: 12,
  users: { email: "asha@example.com", full_name: "Asha Mwinyi", phone: "255700000001" },
}

const INACTIVE = {
  id: "t-2",
  user_id: "u-2",
  vehicle_type: "car",
  vehicle_registration: "T456DEF",
  license_number: "LIC-002",
  kyc_status: "pending",
  availability_status: "busy",
  is_active: false,
  created_at: "2026-01-07T10:00:00Z",
  updated_at: "2026-01-08T10:00:00Z",
  total_deliveries: 3,
  users: { email: "baraka@example.com", full_name: "Baraka Juma" },
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(window, "confirm").mockReturnValue(true)
  mockGet.mockResolvedValue({ data: [ACTIVE, INACTIVE] })
  mockPost.mockResolvedValue({})
  mockDelete.mockResolvedValue({})
})

afterEach(() => {
  jest.restoreAllMocks()
})

async function renderTab() {
  const view = render(<TransporterManagementTab />)
  await waitFor(() => expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument())
  return view
}

const cardFor = (name: string) => {
  const heading = screen.getAllByText(name)[0]
  return (heading.closest("div.relative") ?? heading.parentElement!) as HTMLElement
}

async function openDetails(name: string) {
  await userEvent.click(within(cardFor(name)).getByRole("button", { name: /view details/i }))
  return screen.findByRole("dialog")
}

describe("TransporterManagementTab", () => {
  it("requests the admin transporter list", async () => {
    await renderTab()

    expect(mockGet).toHaveBeenCalledWith("admin/transporters")
  })

  it("shows the total count", async () => {
    await renderTab()

    expect(screen.getByText("2 Total Transporters")).toBeInTheDocument()
  })

  it("narrows the list to a search match", async () => {
    await renderTab()

    await userEvent.type(screen.getByPlaceholderText(/search/i), "baraka")

    await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
    expect(screen.getByText("Baraka Juma")).toBeInTheDocument()
  })

  it("deactivates an active transporter", async () => {
    await renderTab()

    await userEvent.click(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /deactivate/i }))

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/transporters/t-1/deactivate"))
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Transporter Deactivated" }))
  })

  it("activates an inactive transporter", async () => {
    await renderTab()

    await userEvent.click(within(cardFor("Baraka Juma")).getByRole("button", { name: /activate/i }))

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/transporters/t-2/activate"))
  })

  it("leaves the row's control unchanged when the toggle request fails", async () => {
    mockPost.mockRejectedValue(new Error("409"))
    await renderTab()

    await userEvent.click(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /deactivate/i }))

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" })))
    expect(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /deactivate/i })).toBeInTheDocument()
  })

  it("opens the details dialog for the transporter whose card was clicked", async () => {
    await renderTab()

    const dialog = await openDetails("Baraka Juma")

    expect(within(dialog).getAllByText(/Baraka Juma/).length).toBeGreaterThan(0)
  })

  it("deletes the transporter, removes the row and closes", async () => {
    await renderTab()
    const dialog = await openDetails("Baraka Juma")

    await userEvent.click(within(dialog).getByRole("button", { name: /delete transporter/i }))

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/transporters/t-2"))
    await waitFor(() => expect(screen.queryByText("Baraka Juma")).not.toBeInTheDocument())
    expect(screen.getAllByText("Asha Mwinyi").length).toBeGreaterThan(0)
  })

  it("keeps the dialog open and the row present when the delete fails", async () => {
    mockDelete.mockRejectedValue(new Error("foreign key violation"))
    await renderTab()
    const dialog = await openDetails("Baraka Juma")

    await userEvent.click(within(dialog).getByRole("button", { name: /delete transporter/i }))

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Error" })))
    expect(screen.getAllByText("Baraka Juma").length).toBeGreaterThan(0)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
