/**
 * Tests for components/checkout/transport-method-select.tsx.
 *
 * The one branch worth pinning is the price badge: a method priced per
 * kilometre shows "TZS x/KM", one priced per kilogram (rate_per_km null)
 * shows "TZS y/KG" instead. Selecting an option is exercised through Radix's
 * real Select, same pattern as tanzania-address-form.test.tsx.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TransportMethodSelect } from "@/components/checkout/transport-method-select"
import type { TransportMethod } from "@/app/actions/maps"

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

function method(overrides: Partial<TransportMethod> = {}): TransportMethod {
  return {
    id: "m1",
    name: "Boda Boda",
    rate_per_km: 500,
    rate_per_kg: null,
    description: "Fast motorbike delivery",
    ...overrides,
  }
}

describe("TransportMethodSelect", () => {
  it("renders the delivery method heading and placeholder when nothing is selected", () => {
    render(<TransportMethodSelect transportMethods={[method()]} selectedTransportId="" onSelectedTransportIdChange={jest.fn()} />)

    expect(screen.getByRole("heading", { name: "Delivery Method" })).toBeInTheDocument()
    expect(screen.getByText("Please select delivery method")).toBeInTheDocument()
  })

  it("shows a per-KM rate badge for a method priced by distance", async () => {
    const user = userEvent.setup()
    render(
      <TransportMethodSelect
        transportMethods={[method({ rate_per_km: 500, rate_per_kg: null })]}
        selectedTransportId=""
        onSelectedTransportIdChange={jest.fn()}
      />,
    )

    await user.click(screen.getByRole("combobox"))

    expect(screen.getByText("TZS 500/KM")).toBeInTheDocument()
  })

  it("shows a per-KG rate badge for a method priced by weight", async () => {
    const user = userEvent.setup()
    render(
      <TransportMethodSelect
        transportMethods={[method({ id: "m2", name: "Cargo Truck", rate_per_km: null, rate_per_kg: 250 })]}
        selectedTransportId=""
        onSelectedTransportIdChange={jest.fn()}
      />,
    )

    await user.click(screen.getByRole("combobox"))

    expect(screen.getByText("TZS 250/KG")).toBeInTheDocument()
  })

  it("lists every transport method with its name and description", async () => {
    const user = userEvent.setup()
    const methods = [method(), method({ id: "m2", name: "Cargo Truck", rate_per_km: null, rate_per_kg: 250, description: "Bulk cargo" })]
    render(<TransportMethodSelect transportMethods={methods} selectedTransportId="" onSelectedTransportIdChange={jest.fn()} />)

    await user.click(screen.getByRole("combobox"))

    expect(screen.getByRole("option", { name: /Boda Boda/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Cargo Truck/ })).toBeInTheDocument()
    expect(screen.getByText("Bulk cargo")).toBeInTheDocument()
  })

  it("calls onSelectedTransportIdChange with the picked method's id", async () => {
    const user = userEvent.setup()
    const onSelectedTransportIdChange = jest.fn()
    const methods = [method(), method({ id: "m2", name: "Cargo Truck", rate_per_km: null, rate_per_kg: 250 })]
    render(
      <TransportMethodSelect transportMethods={methods} selectedTransportId="" onSelectedTransportIdChange={onSelectedTransportIdChange} />,
    )

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByRole("option", { name: /Cargo Truck/ }))

    expect(onSelectedTransportIdChange).toHaveBeenCalledWith("m2")
  })

  it("shows the selected method's name in the trigger", () => {
    render(
      <TransportMethodSelect
        transportMethods={[method(), method({ id: "m2", name: "Cargo Truck", rate_per_km: null, rate_per_kg: 250 })]}
        selectedTransportId="m2"
        onSelectedTransportIdChange={jest.fn()}
      />,
    )

    expect(screen.getByRole("combobox")).toHaveTextContent("Cargo Truck")
  })

  it("renders with no crash when there are no transport methods", () => {
    render(<TransportMethodSelect transportMethods={[]} selectedTransportId="" onSelectedTransportIdChange={jest.fn()} />)

    expect(screen.getByRole("heading", { name: "Delivery Method" })).toBeInTheDocument()
  })
})
