/**
 * Tests for EditShopDialog (components/vendor/edit-shop-dialog.tsx).
 *
 * Same validation/submission shape as CreateShopDialog, but hydrated from an
 * existing `shop` and PUTting to `shops/:id` instead of POSTing. As in
 * create-shop-dialog.test.tsx, ShopLocationForm is mocked to a stub exposing
 * its `onChange` prop so the tests can drive location state directly instead
 * of exercising the Google Places/Maps integrations it wraps.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditShopDialog } from "@/components/vendor/edit-shop-dialog"

const mockPut = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPut: (...args: unknown[]) => mockPut(...args),
}))

const shop = {
  id: "shop-1",
  name: "Dodoma Crafts",
  description: "Handmade goods",
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
      <button
        type="button"
        onClick={() =>
          onChange({
            address: "9 Uhuru Rd, Sisimba, Mbeya City, Mbeya",
            region: "",
            district: "",
            ward: "",
            village: "",
            street: "9 Uhuru Rd",
            latitude: -8.9,
            longitude: 33.45,
          })
        }
      >
        Fill location missing region
      </button>
      <button
        type="button"
        onClick={() =>
          onChange({
            address: "9 Uhuru Rd, Sisimba, Mbeya City, Mbeya",
            region: "Mbeya",
            district: "Mbeya City",
            ward: "Sisimba",
            village: "",
            street: "",
            latitude: -8.9,
            longitude: 33.45,
          })
        }
      >
        Fill location missing street
      </button>
      <button
        type="button"
        onClick={() =>
          onChange({
            address: "9 Uhuru Rd, Sisimba, Mbeya City, Mbeya",
            region: "Mbeya",
            district: "Mbeya City",
            ward: "Sisimba",
            village: "",
            street: "9 Uhuru Rd",
            latitude: null,
            longitude: null,
          })
        }
      >
        Fill location missing coordinates
      </button>
    </div>
  ),
}))

const props = {
  open: true,
  onOpenChange: jest.fn(),
  shop,
  onSuccess: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPut.mockResolvedValue({})
  jest.useRealTimers()
})

describe("EditShopDialog", () => {
  it("renders nothing when closed", () => {
    render(<EditShopDialog {...props} open={false} />)

    expect(screen.queryByText("Edit Shop Details")).not.toBeInTheDocument()
  })

  it("hydrates name and description from the shop prop", () => {
    render(<EditShopDialog {...props} />)

    expect(screen.getByText("Edit Shop Details")).toBeInTheDocument()
    expect(screen.getByLabelText("Shop Name *")).toHaveValue("Dodoma Crafts")
    expect(screen.getByLabelText("Description")).toHaveValue("Handmade goods")
  })

  it("blocks submit and shows an error when region/district/ward are missing", async () => {
    render(<EditShopDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Fill location missing region" }))
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(await screen.findByText("Please provide Region, District, and Ward for your shop location")).toBeInTheDocument()
    expect(mockPut).not.toHaveBeenCalled()
  })

  it("blocks submit and shows an error when street is missing", async () => {
    render(<EditShopDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Fill location missing street" }))
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(await screen.findByText("Please provide at least a Street or Building name for your shop location")).toBeInTheDocument()
    expect(mockPut).not.toHaveBeenCalled()
  })

  it("blocks submit and shows an error when coordinates are missing", async () => {
    render(<EditShopDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Fill location missing coordinates" }))
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(
      await screen.findByText("Please select a specific location from the search or provide details until GPS coordinates are found."),
    ).toBeInTheDocument()
    expect(mockPut).not.toHaveBeenCalled()
  })

  it("PUTs the edited shop payload to shops/:id and reports success", async () => {
    render(<EditShopDialog {...props} />)

    const nameInput = screen.getByLabelText("Shop Name *")
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, "Dodoma Crafts Co-op")

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1))
    const [path, body] = mockPut.mock.calls[0]
    expect(path).toBe("shops/shop-1")
    expect(body).toMatchObject({
      name: "Dodoma Crafts Co-op",
      description: "Handmade goods",
      address: shop.address,
      region: shop.region,
      district: shop.district,
      ward: shop.ward,
      village: shop.village,
      street: shop.street,
      latitude: shop.latitude,
      longitude: shop.longitude,
    })
    expect(typeof body.updated_at).toBe("string")

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
    expect(props.onSuccess).toHaveBeenCalledTimes(1)
  })

  it("shows an error and does not close when the PUT fails", async () => {
    mockPut.mockRejectedValue(new Error("Server unavailable"))
    render(<EditShopDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(await screen.findByText("Server unavailable")).toBeInTheDocument()
    expect(props.onOpenChange).not.toHaveBeenCalled()
    expect(props.onSuccess).not.toHaveBeenCalled()
  })

  it("shows the saving state while the request is pending", async () => {
    let resolvePut: (value: unknown) => void = () => {}
    mockPut.mockReturnValue(new Promise((resolve) => (resolvePut = resolve)))

    render(<EditShopDialog {...props} />)
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled()

    resolvePut({})
    await waitFor(() => expect(props.onSuccess).toHaveBeenCalled())
  })

  it("closes via Cancel without submitting", async () => {
    render(<EditShopDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
    expect(mockPut).not.toHaveBeenCalled()
  })
})
