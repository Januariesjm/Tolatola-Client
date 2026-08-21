/**
 * Tests for lib/checkout/parse-google-place.ts.
 *
 * Extracted from the Google Autocomplete listener in
 * components/checkout/tanzania-address-form.tsx. Everything downstream of
 * checkout depends on this: the region and district it produces are what the
 * delivery quote is priced from, and a field it leaves blank blocks the buyer
 * behind an "Address Required" toast they cannot clear by retyping.
 */

import {
  TANZANIA_REGIONS,
  buildStreetLine,
  emptyTanzaniaAddress,
  normalizeRegionName,
  placeToAddressData,
  type GoogleAddressComponent,
} from "@/lib/checkout/parse-google-place"

/** Builds one address_components entry. */
const component = (long_name: string, types: string[], short_name = long_name): GoogleAddressComponent => ({ long_name, short_name, types })

/** A realistic Dar es Salaam result. */
const DAR_PLACE = {
  formatted_address: "12 Sam Nujoma Rd, Mikocheni, Kinondoni, Dar es Salaam, Tanzania",
  address_components: [
    component("12", ["street_number"]),
    component("Sam Nujoma Road", ["route"], "Sam Nujoma Rd"),
    component("Mikocheni", ["administrative_area_level_3"]),
    component("Kinondoni District", ["administrative_area_level_2"]),
    component("Dar es Salaam Region", ["administrative_area_level_1"]),
    component("Tanzania", ["country"], "TZ"),
  ],
}

describe("emptyTanzaniaAddress", () => {
  it("fixes the country to Tanzania", () => {
    // The picker is restricted to TZ, so this is never anything else.
    expect(emptyTanzaniaAddress().country).toBe("Tanzania")
  })

  it("leaves every other field blank", () => {
    const { country: _country, ...rest } = emptyTanzaniaAddress()

    expect(Object.values(rest).every((v) => v === "")).toBe(true)
  })

  it("returns a fresh object each call", () => {
    expect(emptyTanzaniaAddress()).not.toBe(emptyTanzaniaAddress())
  })
})

describe("normalizeRegionName", () => {
  it("strips the Region suffix Google appends", () => {
    expect(normalizeRegionName("Mwanza Region")).toBe("Mwanza")
  })

  it("leaves a name with no suffix alone", () => {
    expect(normalizeRegionName("Mwanza")).toBe("Mwanza")
  })

  it("matches the canonical spelling case-insensitively", () => {
    expect(normalizeRegionName("DAR ES SALAAM")).toBe("Dar es Salaam")
  })

  it("does not strip a lowercase region suffix", () => {
    // The suffix strip is case-sensitive, matching Google, which always
    // capitalises it. A lowercase " region" is treated as part of the name.
    expect(normalizeRegionName("kilimanjaro region")).toBe("kilimanjaro region")
  })

  it("canonicalises a lowercase name with no suffix", () => {
    expect(normalizeRegionName("kilimanjaro")).toBe("Kilimanjaro")
  })

  it("keeps an unrecognised region rather than blanking the field", () => {
    // A blank region blocks checkout entirely; an unfamiliar name does not.
    expect(normalizeRegionName("Newly Created Region")).toBe("Newly Created")
  })

  it("recognises the English Zanzibar names Google returns", () => {
    expect(normalizeRegionName("Zanzibar West")).toBe("Zanzibar West")
    expect(normalizeRegionName("Pemba North")).toBe("Pemba North")
  })

  it("resolves every canonical region to itself", () => {
    for (const region of TANZANIA_REGIONS) {
      expect(normalizeRegionName(region)).toBe(region)
    }
  })
})

describe("buildStreetLine", () => {
  it("puts the house number before the road", () => {
    expect(buildStreetLine([component("Sam Nujoma Road", ["route"]), component("12", ["street_number"])])).toBe("12 Sam Nujoma Road")
  })

  it("does not depend on the order the components arrive in", () => {
    const forwards = [component("12", ["street_number"]), component("Sam Nujoma Road", ["route"])]
    const backwards = [component("Sam Nujoma Road", ["route"]), component("12", ["street_number"])]

    expect(buildStreetLine(forwards)).toBe(buildStreetLine(backwards))
  })

  it("uses the short name for the number", () => {
    expect(buildStreetLine([component("Number 12", ["street_number"], "12"), component("Main Rd", ["route"])])).toBe("12 Main Rd")
  })

  it("uses the road alone when there is no number", () => {
    expect(buildStreetLine([component("Sam Nujoma Road", ["route"])])).toBe("Sam Nujoma Road")
  })

  it("falls back to the first segment of the formatted address", () => {
    // A named establishment has no route component; its own name is segment one.
    expect(buildStreetLine([], "Mlimani City, Sam Nujoma Rd, Dar es Salaam")).toBe("Mlimani City")
  })

  it("returns empty when there is nothing to build from", () => {
    expect(buildStreetLine([])).toBe("")
  })

  it("returns empty rather than undefined when the formatted address is absent", () => {
    expect(buildStreetLine([], undefined)).toBe("")
  })
})

describe("placeToAddressData", () => {
  it("maps a full Dar es Salaam result", () => {
    expect(placeToAddressData(DAR_PLACE)).toEqual({
      country: "Tanzania",
      region: "Dar es Salaam",
      district: "Kinondoni",
      ward: "Mikocheni",
      village: "",
      street: "12 Sam Nujoma Road",
    })
  })

  it("strips the District suffix", () => {
    expect(placeToAddressData(DAR_PLACE)?.district).toBe("Kinondoni")
  })

  it("returns null for a place with no components", () => {
    // Google returns this when the buyer typed a query but picked no suggestion.
    expect(placeToAddressData({ formatted_address: "somewhere" })).toBeNull()
  })

  it("returns an otherwise-blank address for an empty component list", () => {
    expect(placeToAddressData({ address_components: [] })).toEqual(emptyTanzaniaAddress())
  })

  it("reads the ward from sublocality_level_1 when there is no level 3", () => {
    const result = placeToAddressData({ address_components: [component("Msasani", ["sublocality_level_1"])] })

    expect(result?.ward).toBe("Msasani")
  })

  it("reads the village from a neighborhood component", () => {
    const result = placeToAddressData({ address_components: [component("Kijitonyama", ["neighborhood"])] })

    expect(result?.village).toBe("Kijitonyama")
  })

  it("reads the village from sublocality_level_2", () => {
    const result = placeToAddressData({ address_components: [component("Makumbusho", ["sublocality_level_2"])] })

    expect(result?.village).toBe("Makumbusho")
  })

  it("lets the last ward-shaped component win", () => {
    // Each component is applied in turn, so this is last-write-wins rather than
    // a precedence between the two type names. Google emits at most one of them
    // in practice, so the order only matters for malformed results.
    const result = placeToAddressData({
      address_components: [component("Ward Three", ["administrative_area_level_3"]), component("Sub One", ["sublocality_level_1"])],
    })

    expect(result?.ward).toBe("Sub One")
  })

  it("uses the only ward-shaped component when there is one", () => {
    const result = placeToAddressData({ address_components: [component("Ward Three", ["administrative_area_level_3"])] })

    expect(result?.ward).toBe("Ward Three")
  })

  it("ignores component types it does not use", () => {
    const result = placeToAddressData({
      address_components: [component("Tanzania", ["country"], "TZ"), component("11000", ["postal_code"])],
    })

    expect(result).toEqual(emptyTanzaniaAddress())
  })

  it("always reports the country as Tanzania", () => {
    const result = placeToAddressData({ address_components: [component("Kenya", ["country"], "KE")] })

    expect(result?.country).toBe("Tanzania")
  })

  it("fills the street from the establishment name when there is no road", () => {
    const result = placeToAddressData({
      formatted_address: "Mlimani City, Dar es Salaam, Tanzania",
      address_components: [component("Dar es Salaam Region", ["administrative_area_level_1"])],
    })

    expect(result?.street).toBe("Mlimani City")
  })

  it("produces every field the checkout validator requires for a complete place", () => {
    // region, district, ward and street are all mandatory downstream.
    const result = placeToAddressData(DAR_PLACE)

    for (const field of ["region", "district", "ward", "street"] as const) {
      expect(result?.[field]).toBeTruthy()
    }
  })

  it("leaves the district blank for a place Google gives no level 2 for", () => {
    // A rural pin can lack a district; checkout then asks the buyer to refine it
    // rather than quoting against a missing field.
    const result = placeToAddressData({
      address_components: [component("Mara Region", ["administrative_area_level_1"])],
    })

    expect(result?.district).toBe("")
  })
})
