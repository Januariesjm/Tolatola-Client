"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { clientApiPost } from "@/lib/api-client"
import { navigateToExternalUrl } from "@/lib/browser-navigation"
import { buildOrderPayload, type ShopDeliveryMap } from "@/lib/checkout/build-order-payload"
import { isCard, validateCheckoutForm, type CheckoutAddress, type CheckoutCardDetails } from "@/lib/checkout/validate-checkout-form"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import type { CartItem, CheckoutUser } from "@/lib/types/checkout"

const log = logger.child("checkout.submit")

/** Payment method that skips the payment gateway entirely. */
const CASH_ON_DELIVERY = "cash-on-delivery"

interface PaymentInitiationResponse {
  success: boolean
  message: string
  transactionId?: string
  /** For cards this is the hosted payment page URL, not a control number. */
  controlNumber?: string
}

interface OrderCreationResponse {
  order?: { id?: string }
  id?: string
  success?: boolean
}

export interface UseCheckoutSubmitOptions {
  user: CheckoutUser | null
  cartItems: CartItem[]
  shopDeliveries: ShopDeliveryMap
  fullName: string
  phone: string
  guestEmail: string
  fullAddress: string
  addressData: CheckoutAddress & { country?: string; village?: string }
  latitude: number | null
  longitude: number | null
  deliveryFee: number
  insuranceFee: number
  total: number
  paymentMethod: string
  paymentPhoneNumber: string
  cardDetails: CheckoutCardDetails
  selectedTransportId: string
  /** Set before a deliberate redirect so the empty-cart guard does not fire. */
  isNavigatingAway: React.MutableRefObject<boolean>
}

/**
 * Owns placing the order: validation, the two network calls, and the redirect.
 *
 * Extracted from components/checkout/checkout-content.tsx, where handleSubmit
 * was ~135 lines mixing form validation, payload assembly, order creation,
 * payment initiation and three different navigation outcomes -- none of it
 * reachable in a test without rendering the whole form and its address picker.
 *
 * The order of operations is load-bearing and unchanged: create the order first,
 * then initiate payment. An order therefore exists even when payment fails,
 * which is deliberate -- it is what lets a buyer retry payment against the same
 * order rather than losing the cart.
 */
export function useCheckoutSubmit(options: UseCheckoutSubmitOptions) {
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false)

  /** Clears the cart and marks the redirect as intentional. */
  const clearCart = () => {
    options.isNavigatingAway.current = true
    localStorage.removeItem("cart")
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateCheckoutForm({
      paymentMethod: options.paymentMethod,
      fullName: options.fullName,
      phone: options.phone,
      guestEmail: options.guestEmail,
      isAuthenticated: Boolean(options.user),
      addressData: options.addressData,
      shopDeliveryCount: Object.keys(options.shopDeliveries).length,
      selectedTransportId: options.selectedTransportId,
      paymentPhoneNumber: options.paymentPhoneNumber,
      cardDetails: options.cardDetails,
    })

    if (validationError) {
      toast({ ...validationError, variant: "destructive" })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const orderPayload = buildOrderPayload({
        cartItems: options.cartItems,
        shopDeliveries: options.shopDeliveries,
        fullName: options.fullName,
        phone: options.phone,
        fullAddress: options.fullAddress,
        addressData: options.addressData,
        guestEmail: options.guestEmail,
        userEmail: options.user?.email,
        latitude: options.latitude,
        longitude: options.longitude,
        deliveryFee: options.deliveryFee,
        insuranceFee: options.insuranceFee,
        total: options.total,
        paymentMethod: options.paymentMethod,
        paymentPhoneNumber: options.paymentPhoneNumber,
        cardDetails: options.cardDetails,
        selectedTransportId: options.selectedTransportId,
      })

      const orderRes = await clientApiPost<OrderCreationResponse>("orders", orderPayload)
      const orderId = orderRes?.order?.id || orderRes?.id

      if (!orderId) {
        throw new Error("Order ID not returned from API")
      }

      if (options.paymentMethod === CASH_ON_DELIVERY) {
        clearCart()
        router.push(`/checkout/success/${orderId}`)
        return
      }

      setIsAwaitingPayment(true)

      const payRes = await clientApiPost<PaymentInitiationResponse>("payments/clickpesa/initiate", {
        orderId,
        paymentMethod: options.paymentMethod,
        paymentDetails: {
          phoneNumber: options.paymentPhoneNumber,
          cardNumber: options.cardDetails.number,
          expiryDate: options.cardDetails.expiry,
          cvv: options.cardDetails.cvv,
        },
      })

      if (!payRes.success) {
        throw new Error(payRes.message || "Failed to initiate payment")
      }

      clearCart()

      // Cards are completed on ClickPesa's hosted page; wallets confirm
      // out-of-band, so those land on the success page immediately.
      if (isCard(options.paymentMethod) && payRes.controlNumber?.startsWith("http")) {
        navigateToExternalUrl(payRes.controlNumber)
      } else {
        router.push(`/checkout/success/${orderId}`)
      }
    } catch (err: unknown) {
      log.error("checkout submission failed", err, { paymentMethod: options.paymentMethod })
      setError(err instanceof Error ? err.message : "An error occurred during checkout")
      setIsAwaitingPayment(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { handleSubmit, isLoading, error, isAwaitingPayment }
}
