/**
 * Tests for TransporterProfileTab (components/transporter/transporter-profile-tab.tsx).
 *
 * Covers the read/edit toggle (fields start disabled, "Edit Profile" enables
 * them, "Cancel" disables them again without resetting typed values), the
 * save flow (two API calls, toast, exits edit mode) and its failure path, and
 * the avatar upload flow (preview + POST to the upload endpoint).
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TransporterProfileTab } from "@/components/transporter/transporter-profile-tab"

// Radix's Select calls `target.hasPointerCapture(...)` unconditionally on
// pointer-down, which throws "not a function" under jsdom without this.
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

const mockRefresh = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

const mockPut = jest.fn()
const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPut: (...args: unknown[]) => mockPut(...args),
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

jest.mock("@/lib/logger", () => {
  const childLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
  return { logger: { child: jest.fn(() => childLogger) } }
})

const baseUser = {
  email: "driver@example.com",
  phone: "255700000000",
  user_metadata: { full_name: "Juma Msafiri", address: "Dar es Salaam" },
}

const baseTransporter = {
  business_name: "Kariakoo Movers",
  vehicle_type: "van",
  license_plate: "T 123 ABC",
  kyc_status: "approved",
}

function renderTab(overrides: { user?: Partial<typeof baseUser>; transporter?: Partial<typeof baseTransporter> } = {}) {
  return render(
    <TransporterProfileTab user={{ ...baseUser, ...overrides.user }} transporter={{ ...baseTransporter, ...overrides.transporter }} />,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPut.mockResolvedValue({})
  mockPost.mockResolvedValue({})
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
})

describe("TransporterProfileTab", () => {
  it("pre-fills the form from the user and transporter props", () => {
    renderTab()

    expect(screen.getByLabelText("Full Name")).toHaveValue("Juma Msafiri")
    expect(screen.getByLabelText("Email Address")).toHaveValue("driver@example.com")
    expect(screen.getByLabelText("Phone Number")).toHaveValue("255700000000")
    expect(screen.getByLabelText(/Base Location/i)).toHaveValue("Dar es Salaam")
    expect(screen.getByLabelText("Business Name")).toHaveValue("Kariakoo Movers")
    expect(screen.getByLabelText("License Plate")).toHaveValue("T 123 ABC")
  })

  it("shows the KYC status badge", () => {
    renderTab()

    expect(screen.getByText("approved")).toBeInTheDocument()
    expect(screen.getByText("Verified Transporter")).toBeInTheDocument()
  })

  it("shows 'Pending' when there is no KYC status", () => {
    renderTab({ transporter: { kyc_status: undefined } })

    expect(screen.getByText("Pending")).toBeInTheDocument()
    expect(screen.queryByText("Verified Transporter")).not.toBeInTheDocument()
  })

  it("shows initials from the full name in the avatar fallback", () => {
    renderTab()

    expect(screen.getByText("JM")).toBeInTheDocument()
  })

  it("disables all fields until Edit Profile is clicked", async () => {
    renderTab()

    expect(screen.getByLabelText("Full Name")).toBeDisabled()
    expect(screen.getByLabelText("Business Name")).toBeDisabled()

    await userEvent.click(screen.getByRole("button", { name: "Edit Profile" }))

    expect(screen.getByLabelText("Full Name")).toBeEnabled()
    expect(screen.getByLabelText("Business Name")).toBeEnabled()
    // Email is always read-only, regardless of edit mode.
    expect(screen.getByLabelText("Email Address")).toBeDisabled()
  })

  it("lets the field values be edited once in edit mode", async () => {
    renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Edit Profile" }))

    const nameInput = screen.getByLabelText("Full Name")
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, "Juma Kassim")

    expect(nameInput).toHaveValue("Juma Kassim")
  })

  it("exits edit mode without submitting when Cancel is clicked", async () => {
    renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Edit Profile" }))
    const nameInput = screen.getByLabelText("Full Name")
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, "Juma Kassim")

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.getByRole("button", { name: "Edit Profile" })).toBeInTheDocument()
    expect(nameInput).toBeDisabled()
    // Cancel only toggles edit mode; it doesn't roll back the typed value.
    expect(nameInput).toHaveValue("Juma Kassim")
    expect(mockPut).not.toHaveBeenCalled()
  })

  it("saves the profile and transporter fields, shows a success toast, and exits edit mode", async () => {
    renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Edit Profile" }))
    await userEvent.clear(screen.getByLabelText("Full Name"))
    await userEvent.type(screen.getByLabelText("Full Name"), "Juma Kassim")
    await userEvent.clear(screen.getByLabelText("Phone Number"))
    await userEvent.type(screen.getByLabelText("Phone Number"), "255711111111")

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() => expect(mockPut).toHaveBeenCalledWith("profile", { full_name: "Juma Kassim", phone: "255711111111" }))
    expect(mockPost).toHaveBeenCalledWith("transporters", {
      business_name: "Kariakoo Movers",
      vehicle_type: "van",
      license_plate: "T 123 ABC",
    })
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Success" }))
    expect(mockRefresh).toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Edit Profile" })).toBeInTheDocument()
  })

  it("changes the vehicle type via the select and includes it in the save", async () => {
    renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Edit Profile" }))

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(await screen.findByRole("option", { name: "Truck / Lorry" }))
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("transporters", expect.objectContaining({ vehicle_type: "truck" })))
  })

  it("shows a destructive toast and stays in edit mode when saving fails", async () => {
    mockPut.mockRejectedValue(new Error("network error"))
    renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Edit Profile" }))

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Error", variant: "destructive" })))
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument()
  })

  it("uploads a profile picture and shows a success toast", async () => {
    renderTab()
    const file = new File(["avatar"], "avatar.png", { type: "image/png" })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    await userEvent.upload(fileInput, file)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/profile/upload-image", expect.objectContaining({ method: "POST" })))
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Success", description: "Profile picture updated successfully" }),
    )
    expect(mockRefresh).toHaveBeenCalled()
  })

  it("shows a destructive toast when the profile picture upload fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false })
    renderTab()
    const file = new File(["avatar"], "avatar.png", { type: "image/png" })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    await userEvent.upload(fileInput, file)

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Error", variant: "destructive" })))
  })
})
