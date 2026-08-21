/**
 * Checkout form validation.
 *
 * Extracted from components/checkout/checkout-content.tsx, where 88 lines of
 * sequential `if (...) { toast(...); return }` sat at the top of handleSubmit.
 * As a pure function the order of the rules — which decides *which* message the
 * buyer sees when several things are wrong — is pinned by tests instead of being
 * implicit in a component.
 *
 * The payment-method groups were also written out a second time further down the
 * same handler when building the payment payload; both now use these constants.
 */

/** Mobile money providers that need a phone number. */
export const MOBILE_MONEY_METHODS = ["m-pesa", "airtel-money", "halopesa", "mixx-by-yas", "ezypesa"] as const

/** Card networks that need full card details. */
export const CARD_METHODS = ["visa", "mastercard", "unionpay"] as const

/**
 * Providers temporarily disabled upstream. Kept as a list so re-enabling one is
 * a one-line change rather than deleting a branch.
 */
export const METHODS_UNDER_MAINTENANCE = ["m-pesa"] as const

/**
 * Mobile money methods that are actually selectable, i.e. excluding the ones
 * under maintenance. Used when deciding whether to send a phone number.
 */
export const SELECTABLE_MOBILE_MONEY_METHODS = MOBILE_MONEY_METHODS.filter(
  (method) => !METHODS_UNDER_MAINTENANCE.includes(method as (typeof METHODS_UNDER_MAINTENANCE)[number]),
)

export const isMobileMoney = (method: string) => MOBILE_MONEY_METHODS.includes(method as (typeof MOBILE_MONEY_METHODS)[number])
export const isCard = (method: string) => CARD_METHODS.includes(method as (typeof CARD_METHODS)[number])
export const isUnderMaintenance = (method: string) =>
  METHODS_UNDER_MAINTENANCE.includes(method as (typeof METHODS_UNDER_MAINTENANCE)[number])

/** The Tanzanian address parts checkout requires. */
export interface CheckoutAddress {
  region?: string
  district?: string
  ward?: string
  street?: string
}

export interface CheckoutCardDetails {
  number: string
  expiry: string
  cvv: string
}

/** Everything the validator inspects. */
export interface CheckoutFormInput {
  paymentMethod: string
  fullName: string
  phone: string
  /** Required only for guests; ignored when signed in. */
  guestEmail: string
  isAuthenticated: boolean
  addressData: CheckoutAddress
  /** How many shops have a delivery quote; zero means no address was resolved. */
  shopDeliveryCount: number
  selectedTransportId: string
  paymentPhoneNumber: string
  cardDetails: CheckoutCardDetails
}

/** A toast-ready failure. */
export interface CheckoutValidationError {
  title: string
  description: string
}

const blank = (value?: string) => !value || value.trim() === ""

/**
 * Returns the first reason the checkout form cannot be submitted, or null when
 * it can. Rule order is significant and matches the original handler.
 */
export function validateCheckoutForm(input: CheckoutFormInput): CheckoutValidationError | null {
  if (isUnderMaintenance(input.paymentMethod)) {
    return {
      title: "Maintenance",
      description: "M-Pesa Vodacom is currently under maintenance. Please try another payment method.",
    }
  }

  if (blank(input.fullName)) {
    return { title: "Name Required", description: "Please enter your full name" }
  }

  if (blank(input.phone)) {
    return { title: "Phone Required", description: "Please enter your phone number" }
  }

  if (!input.isAuthenticated && (!input.guestEmail || !input.guestEmail.includes("@"))) {
    return {
      title: "Email Required",
      description: "Please enter a valid email address for order confirmation",
    }
  }

  const { region, district, ward, street } = input.addressData
  if (!region || !district || !ward || !street) {
    return {
      title: "Address Required",
      description: "Please search and select your location using the search box above",
    }
  }

  if (input.shopDeliveryCount === 0) {
    return {
      title: "Logistics Required",
      description: "Please select a delivery address using the autocomplete search to calculate shipping costs.",
    }
  }

  if (!input.selectedTransportId) {
    return {
      title: "Transport Method Required",
      description: "Please select a delivery method from the dropdown",
    }
  }

  // The maintenance check above already rejected m-pesa, so this only covers
  // the selectable providers.
  if (isMobileMoney(input.paymentMethod) && blank(input.paymentPhoneNumber)) {
    return {
      title: "Phone Number Required",
      description: "Please enter your phone number for mobile money payment",
    }
  }

  if (isCard(input.paymentMethod)) {
    const { number, expiry, cvv } = input.cardDetails
    if (!number || !expiry || !cvv) {
      return {
        title: "Card Details Required",
        description: "Please enter your complete card details",
      }
    }
  }

  return null
}
