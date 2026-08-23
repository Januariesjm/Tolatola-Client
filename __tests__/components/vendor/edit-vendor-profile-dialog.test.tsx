/**
 * Tests for EditVendorProfileDialog
 * (components/vendor/edit-vendor-profile-dialog.tsx).
 *
 * A plain form dialog: it hydrates from `vendor` on open/change, PUTs the
 * edited fields, and reports success/failure via toast. What matters is the
 * hydration effect, that edits flow into the PUT body, and the two toast
 * paths.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditVendorProfileDialog } from "@/components/vendor/edit-vendor-profile-dialog"

const mockPut = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPut: (...args: unknown[]) => mockPut(...args),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const vendor = {
  id: "vendor-1",
  business_name: "Dodoma Crafts",
  phone: "+255700000001",
  description: "Handmade goods",
}

const baseProps = {
  open: true,
  onOpenChange: jest.fn(),
  vendor,
  onSuccess: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPut.mockResolvedValue({})
})

describe("EditVendorProfileDialog", () => {
  it("renders nothing when closed", () => {
    render(<EditVendorProfileDialog {...baseProps} open={false} />)

    expect(screen.queryByText("Edit Business Profile")).not.toBeInTheDocument()
  })

  it("hydrates fields from the vendor prop", () => {
    render(<EditVendorProfileDialog {...baseProps} />)

    expect(screen.getByLabelText("Business Name")).toHaveValue("Dodoma Crafts")
    expect(screen.getByLabelText("Phone Number")).toHaveValue("+255700000001")
    expect(screen.getByLabelText("Business Description")).toHaveValue("Handmade goods")
  })

  it("re-hydrates when the vendor prop changes", () => {
    const { rerender } = render(<EditVendorProfileDialog {...baseProps} />)

    rerender(
      <EditVendorProfileDialog
        {...baseProps}
        vendor={{ id: "vendor-2", business_name: "Mbeya Grains", phone: "+255700000002", description: "Grain trader" }}
      />,
    )

    expect(screen.getByLabelText("Business Name")).toHaveValue("Mbeya Grains")
  })

  it("updates a field's value as the user types", async () => {
    render(<EditVendorProfileDialog {...baseProps} />)

    const nameInput = screen.getByLabelText("Business Name")
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, "New Name Co")

    expect(nameInput).toHaveValue("New Name Co")
  })

  it("submits the edited fields via PUT to vendors/:id and reports success", async () => {
    render(<EditVendorProfileDialog {...baseProps} />)

    const phoneInput = screen.getByLabelText("Phone Number")
    await userEvent.clear(phoneInput)
    await userEvent.type(phoneInput, "+255711111111")

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() =>
      expect(mockPut).toHaveBeenCalledWith("vendors/vendor-1", {
        business_name: "Dodoma Crafts",
        phone: "+255711111111",
        description: "Handmade goods",
      }),
    )

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Profile Updated" }))
    expect(baseProps.onSuccess).toHaveBeenCalledTimes(1)
    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows a destructive toast and keeps the dialog open when the PUT fails", async () => {
    mockPut.mockRejectedValue(new Error("Network unreachable"))
    render(<EditVendorProfileDialog {...baseProps} />)

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Update Failed", description: "Network unreachable", variant: "destructive" }),
      ),
    )

    expect(baseProps.onSuccess).not.toHaveBeenCalled()
    expect(baseProps.onOpenChange).not.toHaveBeenCalled()
  })

  it("shows the saving state while the request is pending", async () => {
    let resolvePut: (value: unknown) => void = () => {}
    mockPut.mockReturnValue(new Promise((resolve) => (resolvePut = resolve)))

    render(<EditVendorProfileDialog {...baseProps} />)
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled()

    resolvePut({})
    await waitFor(() => expect(baseProps.onSuccess).toHaveBeenCalled())
  })

  it("closes via Cancel without submitting", async () => {
    render(<EditVendorProfileDialog {...baseProps} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false)
    expect(mockPut).not.toHaveBeenCalled()
  })
})
