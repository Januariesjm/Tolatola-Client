/**
 * Tests for CreateShopDialog (components/vendor/create-shop-dialog.tsx).
 *
 * ShopLocationForm pulls in TanzaniaAddressForm (Google Places autocomplete)
 * and WebMapPicker (a live Google Map), neither of which is meaningful in
 * jsdom, so it's mocked out here to a stub that exposes its `onChange` prop --
 * exactly what the tests need to drive the location state this dialog
 * validates and submits. What matters in this file is the three location
 * guards, the POST payload shape, and the success/failure paths.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateShopDialog } from "@/components/vendor/create-shop-dialog"

const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

const VALID_LOCATION = {
  address: "12 Samora Ave, Kikuyu, Dodoma Urban, Dodoma",
  region: "Dodoma",
  district: "Dodoma Urban",
  ward: "Kikuyu",
  village: "",
  street: "12 Samora Ave",
  latitude: -6.1731,
  longitude: 35.7419,
}

jest.mock("@/components/vendor/shop-location-form", () => ({
  ShopLocationForm: ({ onChange }: { onChange: (value: unknown) => void }) => (
    <div>
      <button type="button" onClick={() => onChange(VALID_LOCATION)}>
        Fill valid location
      </button>
      <button type="button" onClick={() => onChange({ ...VALID_LOCATION, region: "", district: "", ward: "" })}>
        Fill location missing region
      </button>
      <button type="button" onClick={() => onChange({ ...VALID_LOCATION, street: "" })}>
        Fill location missing street
      </button>
      <button type="button" onClick={() => onChange({ ...VALID_LOCATION, latitude: null, longitude: null })}>
        Fill location missing coordinates
      </button>
    </div>
  ),
}))

const props = {
  open: true,
  onOpenChange: jest.fn(),
  vendorId: "vendor-1",
  onSuccess: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPost.mockResolvedValue({})
})

async function fillValidLocation() {
  await userEvent.click(screen.getByRole("button", { name: "Fill valid location" }))
}

describe("CreateShopDialog", () => {
  it("renders nothing when closed", () => {
    render(<CreateShopDialog {...props} open={false} />)

    expect(screen.queryByText("Create Your Shop")).not.toBeInTheDocument()
  })

  it("renders the title and shop-name/description fields when open", () => {
    render(<CreateShopDialog {...props} />)

    expect(screen.getByText("Create Your Shop")).toBeInTheDocument()
    expect(screen.getByLabelText("Shop Name *")).toBeInTheDocument()
    expect(screen.getByLabelText("Description")).toBeInTheDocument()
  })

  it("blocks submit and shows an error when region/district/ward are missing", async () => {
    render(<CreateShopDialog {...props} />)

    await userEvent.type(screen.getByLabelText("Shop Name *"), "My Shop")
    await userEvent.click(screen.getByRole("button", { name: "Fill location missing region" }))
    await userEvent.click(screen.getByRole("button", { name: "Create Shop" }))

    expect(await screen.findByText("Please provide Region, District, and Ward for your shop location")).toBeInTheDocument()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("blocks submit and shows an error when street is missing", async () => {
    render(<CreateShopDialog {...props} />)

    await userEvent.type(screen.getByLabelText("Shop Name *"), "My Shop")
    await userEvent.click(screen.getByRole("button", { name: "Fill location missing street" }))
    await userEvent.click(screen.getByRole("button", { name: "Create Shop" }))

    expect(await screen.findByText("Please provide at least a Street or Building name for your shop location")).toBeInTheDocument()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("blocks submit and shows an error when coordinates are missing", async () => {
    render(<CreateShopDialog {...props} />)

    await userEvent.type(screen.getByLabelText("Shop Name *"), "My Shop")
    await userEvent.click(screen.getByRole("button", { name: "Fill location missing coordinates" }))
    await userEvent.click(screen.getByRole("button", { name: "Create Shop" }))

    expect(
      await screen.findByText("Please select a specific location from the search or provide details until GPS coordinates are found."),
    ).toBeInTheDocument()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("posts the full shop payload and reports success", async () => {
    render(<CreateShopDialog {...props} />)

    await userEvent.type(screen.getByLabelText("Shop Name *"), "My Amazing Shop")
    await userEvent.type(screen.getByLabelText("Description"), "Best shop in town")
    await fillValidLocation()
    await userEvent.click(screen.getByRole("button", { name: "Create Shop" }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("shops", {
        vendor_id: "vendor-1",
        name: "My Amazing Shop",
        description: "Best shop in town",
        address: VALID_LOCATION.address,
        region: VALID_LOCATION.region,
        district: VALID_LOCATION.district,
        ward: VALID_LOCATION.ward,
        village: VALID_LOCATION.village,
        street: VALID_LOCATION.street,
        latitude: VALID_LOCATION.latitude,
        longitude: VALID_LOCATION.longitude,
        is_active: true,
      }),
    )

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
    expect(props.onSuccess).toHaveBeenCalledTimes(1)
  })

  it("shows an error and does not close when the POST fails", async () => {
    mockPost.mockRejectedValue(new Error("Server unavailable"))
    render(<CreateShopDialog {...props} />)

    await userEvent.type(screen.getByLabelText("Shop Name *"), "My Shop")
    await fillValidLocation()
    await userEvent.click(screen.getByRole("button", { name: "Create Shop" }))

    expect(await screen.findByText("Server unavailable")).toBeInTheDocument()
    expect(props.onOpenChange).not.toHaveBeenCalled()
    expect(props.onSuccess).not.toHaveBeenCalled()
  })

  it("shows the creating state while the request is pending", async () => {
    let resolvePost: (value: unknown) => void = () => {}
    mockPost.mockReturnValue(new Promise((resolve) => (resolvePost = resolve)))

    render(<CreateShopDialog {...props} />)
    await userEvent.type(screen.getByLabelText("Shop Name *"), "My Shop")
    await fillValidLocation()
    await userEvent.click(screen.getByRole("button", { name: "Create Shop" }))

    expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled()

    resolvePost({})
    await waitFor(() => expect(props.onSuccess).toHaveBeenCalled())
  })

  it("closes via Cancel without submitting", async () => {
    render(<CreateShopDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
    expect(mockPost).not.toHaveBeenCalled()
  })
})
