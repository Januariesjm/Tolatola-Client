/**
 * Tests for ShopLocationForm (components/vendor/shop-location-form.tsx).
 *
 * It wraps TanzaniaAddressForm (Google Places autocomplete) and WebMapPicker
 * (a live Google Map) -- neither does anything meaningful in jsdom, and both
 * already have their own coverage story via the map/address behaviour they
 * own. Both are mocked to stubs that expose their callback props, so what's
 * under test here is this component's own logic: the "is location ready"
 * banner, and how each child's callback is translated into the merged
 * `onChange` value this component reports upward.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ShopLocationForm } from "@/components/vendor/shop-location-form"

const mockAddressChange = jest.fn()
const mockAddressComplete = jest.fn()
jest.mock("@/components/checkout/tanzania-address-form", () => ({
  TanzaniaAddressForm: ({
    onChange,
    onAddressComplete,
  }: {
    onChange: (v: unknown) => void
    onAddressComplete: (address: string, coords?: { lat: number; lng: number }) => void
  }) => {
    mockAddressChange.mockImplementation(onChange)
    mockAddressComplete.mockImplementation(onAddressComplete)
    return (
      <div data-testid="tanzania-address-form">
        <button type="button" onClick={() => onChange({ region: "Dodoma", district: "Dodoma Urban" })}>
          Change address
        </button>
        <button type="button" onClick={() => onAddressComplete("12 Samora Ave, Dodoma", { lat: -6.1731, lng: 35.7419 })}>
          Complete address
        </button>
      </div>
    )
  },
}))

const mockLocationSelect = jest.fn()
jest.mock("@/components/checkout/web-map-picker", () => ({
  WebMapPicker: ({ onLocationSelect }: { onLocationSelect: (coords: { lat: number; lng: number }) => void }) => {
    mockLocationSelect.mockImplementation(onLocationSelect)
    return (
      <div data-testid="web-map-picker">
        <button type="button" onClick={() => onLocationSelect({ lat: -8.9, lng: 33.45 })}>
          Pin on map
        </button>
      </div>
    )
  },
}))

const emptyValue = {
  address: "",
  region: "",
  district: "",
  ward: "",
  village: "",
  street: "",
  latitude: null,
  longitude: null,
}

const readyValue = {
  address: "12 Samora Ave, Kikuyu, Dodoma Urban, Dodoma",
  region: "Dodoma",
  district: "Dodoma Urban",
  ward: "Kikuyu",
  village: "",
  street: "12 Samora Ave",
  latitude: -6.1731,
  longitude: 35.7419,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("ShopLocationForm", () => {
  it("shows the 'Location Incomplete' banner when required fields are missing", () => {
    render(<ShopLocationForm value={emptyValue} onChange={jest.fn()} />)

    expect(screen.getByText("Location Incomplete")).toBeInTheDocument()
    expect(screen.queryByText("Coordinates Sync Active")).not.toBeInTheDocument()
  })

  it("shows the 'Coordinates Sync Active' banner with the address once location is ready", () => {
    render(<ShopLocationForm value={readyValue} onChange={jest.fn()} />)

    expect(screen.getByText("Coordinates Sync Active")).toBeInTheDocument()
    expect(screen.getByText(readyValue.address)).toBeInTheDocument()
    expect(screen.getByText("LAT: -6.173100")).toBeInTheDocument()
    expect(screen.getByText("LNG: 35.741900")).toBeInTheDocument()
  })

  it("falls back to a constructed address when the ready value has no `address`", () => {
    render(<ShopLocationForm value={{ ...readyValue, address: "" }} onChange={jest.fn()} />)

    expect(screen.getByText(`${readyValue.street}, ${readyValue.ward}, ${readyValue.district}, ${readyValue.region}`)).toBeInTheDocument()
  })

  it("merges TanzaniaAddressForm's onChange into the existing value", async () => {
    const onChange = jest.fn()
    render(<ShopLocationForm value={emptyValue} onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "Change address" }))

    expect(onChange).toHaveBeenCalledWith({
      ...emptyValue,
      region: "Dodoma",
      district: "Dodoma Urban",
    })
  })

  it("applies TanzaniaAddressForm's onAddressComplete as address + coordinates", async () => {
    const onChange = jest.fn()
    render(<ShopLocationForm value={emptyValue} onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "Complete address" }))

    expect(onChange).toHaveBeenCalledWith({
      ...emptyValue,
      address: "12 Samora Ave, Dodoma",
      latitude: -6.1731,
      longitude: 35.7419,
    })
  })

  it("sets latitude/longitude to null when onAddressComplete has no coordinates", async () => {
    const onChange = jest.fn()
    render(<ShopLocationForm value={readyValue} onChange={onChange} />)

    // Re-trigger the mocked onAddressComplete without a coordinates argument.
    mockAddressComplete("Some Address")

    expect(onChange).toHaveBeenCalledWith({
      ...readyValue,
      address: "Some Address",
      latitude: null,
      longitude: null,
    })
  })

  it("applies WebMapPicker's onLocationSelect as new coordinates", async () => {
    const onChange = jest.fn()
    render(<ShopLocationForm value={emptyValue} onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "Pin on map" }))

    expect(onChange).toHaveBeenCalledWith({
      ...emptyValue,
      latitude: -8.9,
      longitude: 33.45,
    })
  })

  it("passes the current value through to WebMapPicker", () => {
    render(<ShopLocationForm value={readyValue} onChange={jest.fn()} />)

    expect(screen.getByTestId("web-map-picker")).toBeInTheDocument()
  })
})
