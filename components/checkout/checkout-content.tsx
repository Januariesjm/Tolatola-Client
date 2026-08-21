"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { useCheckoutDelivery } from "@/hooks/use-checkout-delivery"
import { useCheckoutSubmit } from "@/hooks/use-checkout-submit"
import { CheckoutShippingSection, type CheckoutAddressData } from "@/components/checkout/checkout-shipping-section"
import { OrderSummaryCard } from "@/components/checkout/order-summary-card"
import { PaymentMethodAccordion } from "@/components/checkout/payment-method-accordion"
import { PaymentProcessingOverlay } from "@/components/checkout/payment-processing-overlay"
import { TransportMethodSelect } from "@/components/checkout/transport-method-select"
import { useLanguage } from "@/lib/i18n/language-context"
import type { CheckoutCardDetails } from "@/lib/checkout/validate-checkout-form"
import type { CheckoutContentProps } from "@/lib/types/checkout"

/** Wallet pre-selected when the page loads. */
const DEFAULT_PAYMENT_METHOD = "airtel-money"

const EMPTY_ADDRESS: CheckoutAddressData = {
  country: "Tanzania",
  region: "",
  district: "",
  ward: "",
  village: "",
  street: "",
}

const EMPTY_CARD: CheckoutCardDetails = { number: "", expiry: "", cvv: "" }

/**
 * The checkout page.
 *
 * This composes four sections and owns only the form fields that more than one
 * of them needs. Everything else lives next to the thing that uses it:
 *
 *   - cart, quoting and totals      -> hooks/use-checkout-delivery
 *   - validation, ordering, payment -> hooks/use-checkout-submit
 *   - payload assembly              -> lib/checkout/build-order-payload
 *   - the method lists              -> lib/checkout/payment-methods
 *
 * It was previously ~840 lines holding all of that inline.
 */
export function CheckoutContent({ user }: CheckoutContentProps) {
  const { t } = useLanguage()
  const delivery = useCheckoutDelivery()

  const [fullName, setFullName] = useState(user?.full_name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [guestEmail, setGuestEmail] = useState("")
  const [addressData, setAddressData] = useState<CheckoutAddressData>(EMPTY_ADDRESS)

  const [paymentMethod, setPaymentMethod] = useState<string>(DEFAULT_PAYMENT_METHOD)
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState(user?.phone || "")
  const [cardDetails, setCardDetails] = useState<CheckoutCardDetails>(EMPTY_CARD)

  const { handleSubmit, isLoading, error, isAwaitingPayment } = useCheckoutSubmit({
    user,
    cartItems: delivery.cartItems,
    shopDeliveries: delivery.shopDeliveries,
    fullName,
    phone,
    guestEmail,
    fullAddress: delivery.fullAddress,
    addressData,
    latitude: delivery.latitude,
    longitude: delivery.longitude,
    deliveryFee: delivery.deliveryFee,
    insuranceFee: delivery.insuranceFee,
    total: delivery.total,
    paymentMethod,
    paymentPhoneNumber,
    cardDetails,
    selectedTransportId: delivery.selectedTransportId,
    isNavigatingAway: delivery.isNavigatingAway,
  })

  // useCheckoutDelivery redirects to /cart for an empty cart; render nothing
  // rather than an empty summary while that navigation happens.
  if (delivery.cartItems.length === 0) return null

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-10">
      {isAwaitingPayment && <PaymentProcessingOverlay />}

      <div className="container mx-auto px-3 sm:px-4 py-4 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-[10px]">
                <ShieldCheck className="h-4 w-4" />
                <span>{t("checkout.title")}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-stone-900 leading-none">
                {t("checkout.place_order")}
              </h1>
              <p className="text-stone-600 text-xs sm:text-base font-medium max-w-xl">Complete your purchase securely below.</p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1 p-4 bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{t("cart.total")}</p>
              <p className="text-2xl font-black text-primary tracking-tight">TZS {delivery.total.toLocaleString()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6 md:space-y-12">
              <div className="space-y-4">
                <CheckoutShippingSection
                  heading={t("checkout.shipping")}
                  fullName={fullName}
                  onFullNameChange={setFullName}
                  phone={phone}
                  onPhoneChange={setPhone}
                  showGuestEmail={!user}
                  guestEmail={guestEmail}
                  onGuestEmailChange={setGuestEmail}
                  userId={user?.id}
                  addressData={addressData}
                  onAddressDataChange={setAddressData}
                  onAddressComplete={delivery.handleAddressComplete}
                  latitude={delivery.latitude}
                  longitude={delivery.longitude}
                  isCalculatingDelivery={delivery.isCalculatingDelivery}
                  deliveryError={delivery.deliveryError}
                  shopDeliveries={delivery.shopDeliveries}
                />

                <TransportMethodSelect
                  transportMethods={delivery.transportMethods}
                  selectedTransportId={delivery.selectedTransportId}
                  onSelectedTransportIdChange={delivery.setSelectedTransportId}
                />
              </div>

              <PaymentMethodAccordion
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                paymentPhoneNumber={paymentPhoneNumber}
                onPaymentPhoneNumberChange={setPaymentPhoneNumber}
                cardDetails={cardDetails}
                onCardDetailsChange={setCardDetails}
              />
            </div>

            <OrderSummaryCard
              cartItems={delivery.cartItems}
              subtotal={delivery.subtotal}
              deliveryFee={delivery.deliveryFee}
              insuranceFee={delivery.insuranceFee}
              total={delivery.total}
              hasDeliveryQuotes={Object.keys(delivery.shopDeliveries).length > 0}
              isLoading={isLoading}
              isCalculatingDelivery={delivery.isCalculatingDelivery}
              paymentMethod={paymentMethod}
              error={error}
            />
          </form>
        </div>
      </div>
    </div>
  )
}
