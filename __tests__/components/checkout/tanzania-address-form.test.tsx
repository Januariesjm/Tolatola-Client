/**
 * Tests for TanzaniaAddressForm (components/checkout/tanzania-address-form.tsx).
 *
 * The component has two halves:
 *  - A manual entry grid (Region select + District/Ward/Street/Village inputs)
 *    that is plain React state plumbing -- no Maps SDK involved. This is
 *    exercised directly.
 *  - A Google Places Autocomplete search box that loads a script tag via the
 *    `getGoogleMapsScriptUrl` server action and, once `window.google` is
 *    available, wires up `google.maps.places.Autocomplete`. That SDK is
 *    mocked with a minimal fake constructor so the `place_changed` wiring
 *    (mapping a place to address fields, firing onChange/onAddressComplete,
 *    and the associated toasts) can be exercised without touching real Google
 *    Maps.
 */

import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TanzaniaAddressForm } from "@/components/checkout/tanzania-address-form"
import { TANZANIA_REGIONS } from "@/lib/checkout/parse-google-place"

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

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const mockGetGoogleMapsScriptUrl = jest.fn()
jest.mock("@/app/actions/maps", () => ({
  getGoogleMapsScriptUrl: () => mockGetGoogleMapsScriptUrl(),
}))

const emptyValue = {
  country: "Tanzania",
  region: "",
  district: "",
  ward: "",
  village: "",
  street: "",
}

const filledValue = {
  country: "Tanzania",
  region: "Dodoma",
  district: "Dodoma Urban",
  ward: "Kikuyu",
  village: "Miyuji",
  street: "12 Samora Ave",
}

/** Minimal stand-in for google.maps.places.Autocomplete. */
class MockAutocomplete {
  static instances: MockAutocomplete[] = []
  listeners: Record<string, () => void> = {}
  place: unknown = {}

  constructor(_input: HTMLInputElement, _opts: unknown) {
    MockAutocomplete.instances.push(this)
  }

  addListener(event: string, cb: () => void) {
    this.listeners[event] = cb
  }

  getPlace() {
    return this.place
  }

  fireChanged(place: unknown) {
    this.place = place
    this.listeners.place_changed?.()
  }
}

function installMockGoogle() {
  MockAutocomplete.instances = []
  ;(window as unknown as { google: unknown }).google = {
    maps: { places: { Autocomplete: MockAutocomplete } },
  }
}

function removeMockGoogle() {
  delete (window as unknown as { google?: unknown }).google
}

beforeEach(() => {
  jest.clearAllMocks()
  removeMockGoogle()
  mockGetGoogleMapsScriptUrl.mockResolvedValue(null)
})

afterEach(() => {
  // The component appends a real <script> tag to document.head and never
  // removes it -- jsdom's document persists across tests in the same file,
  // so a stale tag from an earlier test would otherwise be the one a later
  // test's querySelector finds.
  document.querySelectorAll("script[src*='maps.googleapis.com']").forEach((el) => el.remove())
})

describe("TanzaniaAddressForm", () => {
  describe("manual entry fields", () => {
    it("renders all fields with the given values", () => {
      render(<TanzaniaAddressForm value={filledValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      expect(screen.getByRole("combobox")).toHaveTextContent("Dodoma")
      expect(screen.getByLabelText("District *")).toHaveValue("Dodoma Urban")
      expect(screen.getByLabelText("Ward *")).toHaveValue("Kikuyu")
      expect(screen.getByLabelText("Street / Building *")).toHaveValue("12 Samora Ave")
      expect(screen.getByLabelText("Village / Mtaa / Notes")).toHaveValue("Miyuji")
    })

    it("shows the placeholder when no region is selected", () => {
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)
      expect(screen.getByText("Select Region")).toBeInTheDocument()
    })

    it("lists every Tanzanian region as a select option", async () => {
      const user = userEvent.setup()
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      await user.click(screen.getByRole("combobox"))

      for (const region of TANZANIA_REGIONS) {
        expect(screen.getByRole("option", { name: region })).toBeInTheDocument()
      }
    })

    it("calls onChange with the merged region when a region is picked", async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      render(<TanzaniaAddressForm value={emptyValue} onChange={onChange} onAddressComplete={jest.fn()} />)

      await user.click(screen.getByRole("combobox"))
      await user.click(screen.getByRole("option", { name: "Mwanza" }))

      expect(onChange).toHaveBeenCalledWith({ ...emptyValue, region: "Mwanza" })
    })

    it("calls onChange with the merged district when the district input changes", () => {
      const onChange = jest.fn()
      render(<TanzaniaAddressForm value={emptyValue} onChange={onChange} onAddressComplete={jest.fn()} />)

      fireEvent.change(screen.getByLabelText("District *"), { target: { value: "Kinondoni" } })
      expect(onChange).toHaveBeenCalledWith({ ...emptyValue, district: "Kinondoni" })
    })

    it("calls onChange with the merged ward when the ward input changes", () => {
      const onChange = jest.fn()
      render(<TanzaniaAddressForm value={emptyValue} onChange={onChange} onAddressComplete={jest.fn()} />)

      fireEvent.change(screen.getByLabelText("Ward *"), { target: { value: "Masaki" } })
      expect(onChange).toHaveBeenCalledWith({ ...emptyValue, ward: "Masaki" })
    })

    it("calls onChange with the merged street when the street input changes", () => {
      const onChange = jest.fn()
      render(<TanzaniaAddressForm value={emptyValue} onChange={onChange} onAddressComplete={jest.fn()} />)

      fireEvent.change(screen.getByLabelText("Street / Building *"), { target: { value: "Samora Ave" } })
      expect(onChange).toHaveBeenCalledWith({ ...emptyValue, street: "Samora Ave" })
    })

    it("calls onChange with the merged village when the village input changes", () => {
      const onChange = jest.fn()
      render(<TanzaniaAddressForm value={emptyValue} onChange={onChange} onAddressComplete={jest.fn()} />)

      fireEvent.change(screen.getByLabelText("Village / Mtaa / Notes"), { target: { value: "Miyuji" } })
      expect(onChange).toHaveBeenCalledWith({ ...emptyValue, village: "Miyuji" })
    })

    it("preserves the rest of the address when one field changes", () => {
      const onChange = jest.fn()
      render(<TanzaniaAddressForm value={filledValue} onChange={onChange} onAddressComplete={jest.fn()} />)

      fireEvent.change(screen.getByLabelText("Ward *"), { target: { value: "Nzuguni" } })
      expect(onChange).toHaveBeenCalledWith({ ...filledValue, ward: "Nzuguni" })
    })

    it("marks district, ward, and street inputs as required but leaves village optional", () => {
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      expect(screen.getByLabelText("District *")).toBeRequired()
      expect(screen.getByLabelText("Ward *")).toBeRequired()
      expect(screen.getByLabelText("Street / Building *")).toBeRequired()
      expect(screen.getByLabelText("Village / Mtaa / Notes")).not.toBeRequired()
    })
  })

  describe("address search / Google Places loading", () => {
    it("disables the search input and shows a loading placeholder before the script resolves", () => {
      mockGetGoogleMapsScriptUrl.mockReturnValue(new Promise(() => {})) // never resolves
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      const searchInput = screen.getByLabelText("Address Search")
      expect(searchInput).toBeDisabled()
      expect(searchInput).toHaveAttribute("placeholder", "Loading maps...")
    })

    it("enables the search input once the script URL resolves to null (no API key)", async () => {
      mockGetGoogleMapsScriptUrl.mockResolvedValue(null)
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      const searchInput = await screen.findByLabelText("Address Search")
      await waitFor(() => expect(searchInput).not.toBeDisabled())
      expect(searchInput).toHaveAttribute("placeholder", "Type to search location...")
    })

    it("skips loading the script entirely when window.google is already available", async () => {
      installMockGoogle()
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      expect(mockGetGoogleMapsScriptUrl).not.toHaveBeenCalled()
      await waitFor(() => expect(screen.getByLabelText("Address Search")).not.toBeDisabled())
    })

    it("updates the search input value as the user types", async () => {
      const user = userEvent.setup()
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      const searchInput = await screen.findByLabelText("Address Search")
      await waitFor(() => expect(searchInput).not.toBeDisabled())

      await user.type(searchInput, "Mlimani City")
      expect(searchInput).toHaveValue("Mlimani City")
    })

    it("shows the 'Active Autocomplete' badge once google is loaded and there is a query", async () => {
      installMockGoogle()
      const user = userEvent.setup()
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      const searchInput = await screen.findByLabelText("Address Search")
      await waitFor(() => expect(searchInput).not.toBeDisabled())
      expect(screen.queryByText("Active Autocomplete")).not.toBeInTheDocument()

      await user.type(searchInput, "Mlimani")
      expect(screen.getByText("Active Autocomplete")).toBeInTheDocument()
    })

    it("appends a script tag to <head> pointing at the resolved script URL", async () => {
      mockGetGoogleMapsScriptUrl.mockResolvedValue("https://maps.googleapis.com/maps/api/js?key=abc&callback=initGoogleMapsCallback")
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      await waitFor(() => {
        const script = document.head.querySelector("script[src*='maps.googleapis.com']")
        expect(script).not.toBeNull()
      })

      const script = document.head.querySelector("script[src*='maps.googleapis.com']") as HTMLScriptElement
      expect(script.async).toBe(true)
      expect(script.defer).toBe(true)
    })

    it("becomes available once window.initGoogleMapsCallback fires (the script's own onload callback)", async () => {
      mockGetGoogleMapsScriptUrl.mockResolvedValue("https://maps.googleapis.com/maps/api/js?key=abc")
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      const searchInput = await screen.findByLabelText("Address Search")
      // Stays disabled/loading until the script's own onload callback fires --
      // resolving the script URL alone isn't enough.
      await waitFor(() => expect(searchInput).toBeDisabled())
      expect(screen.queryByText("Active Autocomplete")).not.toBeInTheDocument()

      act(() => {
        ;(window as unknown as { initGoogleMapsCallback: () => void }).initGoogleMapsCallback()
      })

      await waitFor(() => expect(searchInput).not.toBeDisabled())
      await userEvent.setup().type(searchInput, "x")
      expect(screen.getByText("Active Autocomplete")).toBeInTheDocument()
    })

    it("shows a destructive toast when the maps script itself fails to load", async () => {
      mockGetGoogleMapsScriptUrl.mockResolvedValue("https://maps.googleapis.com/maps/api/js?key=abc")
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      await waitFor(() => {
        expect(document.head.querySelector("script[src*='maps.googleapis.com']")).not.toBeNull()
      })
      const script = document.head.querySelector("script[src*='maps.googleapis.com']") as HTMLScriptElement

      act(() => {
        script.onerror?.(new Event("error"))
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: "Map Loading Error",
        description: "Address autocomplete failed to load.",
        variant: "destructive",
      })
      await waitFor(() => expect(screen.getByLabelText("Address Search")).not.toBeDisabled())
    })

    it("stops loading quietly when getGoogleMapsScriptUrl rejects", async () => {
      mockGetGoogleMapsScriptUrl.mockRejectedValue(new Error("network error"))
      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      await waitFor(() => expect(screen.getByLabelText("Address Search")).not.toBeDisabled())
      expect(mockToast).not.toHaveBeenCalled()
    })
  })

  describe("place_changed wiring", () => {
    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    async function renderAndInitAutocomplete(props: {
      onChange: (v: unknown) => void
      onAddressComplete: (address: string, coords?: { lat: number; lng: number }) => void
    }) {
      installMockGoogle()
      render(<TanzaniaAddressForm value={emptyValue} onChange={props.onChange} onAddressComplete={props.onAddressComplete} />)

      // The component wires up Autocomplete 200ms after google becomes available.
      await act(async () => {
        jest.advanceTimersByTime(250)
      })

      return MockAutocomplete.instances[0]
    }

    const place = {
      formatted_address: "12 Samora Ave, Dodoma",
      address_components: [
        { long_name: "Dodoma", short_name: "Dodoma", types: ["administrative_area_level_1"] },
        { long_name: "Dodoma Urban District", short_name: "Dodoma Urban", types: ["administrative_area_level_2"] },
        { long_name: "Kikuyu", short_name: "Kikuyu", types: ["administrative_area_level_3"] },
        { long_name: "Samora Ave", short_name: "Samora Ave", types: ["route"] },
        { long_name: "12", short_name: "12", types: ["street_number"] },
      ],
      geometry: {
        location: { lat: () => -6.1731, lng: () => 35.7419 },
      },
    }

    it("calls onChange and onAddressComplete with coordinates when a place with geometry is picked", async () => {
      const onChange = jest.fn()
      const onAddressComplete = jest.fn()
      const autocomplete = await renderAndInitAutocomplete({ onChange, onAddressComplete })

      expect(autocomplete).toBeDefined()

      act(() => {
        autocomplete.fireChanged(place)
      })

      expect(onChange).toHaveBeenCalledWith({
        country: "Tanzania",
        region: "Dodoma",
        district: "Dodoma Urban",
        ward: "Kikuyu",
        village: "",
        street: "12 Samora Ave",
      })
      expect(onAddressComplete).toHaveBeenCalledWith("12 Samora Ave, Dodoma", { lat: -6.1731, lng: 35.7419 })
      expect(mockToast).toHaveBeenCalledWith({ title: "Address Found", description: "Location synced and fields auto-filled." })
    })

    it("shows a warning toast and skips onAddressComplete when the place has no coordinates", async () => {
      const onChange = jest.fn()
      const onAddressComplete = jest.fn()
      const autocomplete = await renderAndInitAutocomplete({ onChange, onAddressComplete })

      act(() => {
        autocomplete.fireChanged({ ...place, geometry: undefined })
      })

      expect(onChange).toHaveBeenCalled()
      expect(onAddressComplete).not.toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith({
        title: "Location Warning",
        description: "Coordinates not found. Delivery calculation may be unavailable.",
        variant: "destructive",
      })
    })

    it("does nothing when the place has no address_components", async () => {
      const onChange = jest.fn()
      const onAddressComplete = jest.fn()
      const autocomplete = await renderAndInitAutocomplete({ onChange, onAddressComplete })

      act(() => {
        autocomplete.fireChanged({ formatted_address: "Somewhere" })
      })

      expect(onChange).not.toHaveBeenCalled()
      expect(onAddressComplete).not.toHaveBeenCalled()
    })

    it("swallows an error thrown while constructing the Autocomplete instance", async () => {
      installMockGoogle()
      ;(window as unknown as { google: { maps: { places: { Autocomplete: unknown } } } }).google.maps.places.Autocomplete = class {
        constructor() {
          throw new Error("boom")
        }
      }

      render(<TanzaniaAddressForm value={emptyValue} onChange={jest.fn()} onAddressComplete={jest.fn()} />)

      // Should not throw / crash the component when the constructor fails.
      await act(async () => {
        jest.advanceTimersByTime(250)
      })

      expect(screen.getByLabelText("Address Search")).toBeInTheDocument()
    })
  })
})
