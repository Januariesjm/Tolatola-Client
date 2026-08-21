/**
 * Maps a Google Places result onto the Tanzanian address fields checkout needs.
 *
 * Extracted from the `place_changed` listener in
 * components/checkout/tanzania-address-form.tsx, where ~30 lines of component
 * mapping ran inside a callback attached to a Google Autocomplete instance --
 * unreachable in a test without stubbing the whole Maps SDK, despite being pure
 * data transformation.
 *
 * It matters because everything downstream depends on it: the region and
 * district it produces are what the delivery quote is calculated from, and a
 * missing field silently blocks checkout behind an "Address Required" toast the
 * buyer cannot clear by retyping.
 */

/**
 * Regions as Google Maps names them.
 *
 * Deliberately *not* the list in lib/validation-survey-options.ts, which uses
 * the Swahili official names for Zanzibar ("Unguja Kaskazini") because it labels
 * a survey dropdown. Google returns the English forms ("Zanzibar North"), and
 * these values exist to be matched against Google's output.
 */
export const TANZANIA_REGIONS = [
  "Arusha",
  "Dar es Salaam",
  "Dodoma",
  "Geita",
  "Iringa",
  "Kagera",
  "Katavi",
  "Kigoma",
  "Kilimanjaro",
  "Lindi",
  "Manyara",
  "Mara",
  "Mbeya",
  "Morogoro",
  "Mtwara",
  "Mwanza",
  "Njombe",
  "Pemba North",
  "Pemba South",
  "Pwani",
  "Rukwa",
  "Ruvuma",
  "Shinyanga",
  "Simiyu",
  "Singida",
  "Songwe",
  "Tabora",
  "Tanga",
  "Zanzibar North",
  "Zanzibar South and Central",
  "Zanzibar West",
]

/** The address fields the checkout form collects. */
export interface TanzaniaAddressData {
  country: string
  region: string
  district: string
  ward: string
  village: string
  street: string
}

/** One entry of a Places result's `address_components`. */
export interface GoogleAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

/** The subset of a Places result this reads. */
export interface GooglePlaceLike {
  address_components?: GoogleAddressComponent[]
  formatted_address?: string
}

/** A blank Tanzanian address. Country is fixed: the picker is restricted to TZ. */
export function emptyTanzaniaAddress(): TanzaniaAddressData {
  return { country: "Tanzania", region: "", district: "", ward: "", village: "", street: "" }
}

/**
 * Normalises Google's region name to one of TANZANIA_REGIONS.
 *
 * Google appends " Region" to some names ("Mwanza Region"), so that suffix is
 * stripped first. The match is case-insensitive, and an unrecognised name is
 * returned as-is rather than discarded -- a region the list has not caught up
 * with is still better than an empty field, which would block checkout.
 */
export function normalizeRegionName(googleName: string): string {
  const stripped = googleName.replace(" Region", "")
  return TANZANIA_REGIONS.find((region) => region.toLowerCase() === stripped.toLowerCase()) ?? stripped
}

/**
 * Builds the street line from a place's components.
 *
 * The house number precedes the road name, and Google emits them as separate
 * components in no guaranteed order -- hence unshift for the number rather than
 * relying on the order they arrive in.
 *
 * Falls back to the first segment of the formatted address, which for a named
 * establishment ("Mlimani City, Sam Nujoma Rd...") is the place's own name.
 */
export function buildStreetLine(components: GoogleAddressComponent[], formattedAddress?: string): string {
  const parts: string[] = []

  for (const component of components) {
    if (component.types.includes("route")) {
      parts.push(component.long_name)
    } else if (component.types.includes("street_number")) {
      parts.unshift(component.short_name)
    }
  }

  return parts.join(" ") || formattedAddress?.split(",")[0] || ""
}

/**
 * Maps a Places result to the checkout address fields.
 *
 * Returns null when the place carries no components at all, which is what
 * Google returns for a query the buyer typed but never picked a suggestion for.
 */
export function placeToAddressData(place: GooglePlaceLike): TanzaniaAddressData | null {
  if (!place.address_components) return null

  const address = emptyTanzaniaAddress()

  for (const component of place.address_components) {
    const { types } = component

    if (types.includes("administrative_area_level_1")) {
      address.region = normalizeRegionName(component.long_name)
    } else if (types.includes("administrative_area_level_2")) {
      address.district = component.long_name.replace(" District", "")
    } else if (types.includes("administrative_area_level_3") || types.includes("sublocality_level_1")) {
      address.ward = component.long_name
    } else if (types.includes("sublocality_level_2") || types.includes("neighborhood")) {
      address.village = component.long_name
    }
  }

  address.street = buildStreetLine(place.address_components, place.formatted_address)

  return address
}
