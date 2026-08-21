"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Info, Loader2 } from "lucide-react"
import { TanzaniaAddressForm } from "@/components/checkout/tanzania-address-form"
import { WebMapPicker } from "@/components/checkout/web-map-picker"
import { DeliveryBreakdown } from "@/components/checkout/delivery-breakdown"
import type { ShopDeliveryMap } from "@/lib/checkout/build-order-payload"

/** The Tanzanian address parts the checkout form collects. */
export interface CheckoutAddressData {
  country: string
  region: string
  district: string
  ward: string
  village: string
  street: string
}

interface CheckoutShippingSectionProps {
  heading: string
  fullName: string
  onFullNameChange: (value: string) => void
  phone: string
  onPhoneChange: (value: string) => void
  /** Guest email input renders only when there is no signed-in user. */
  showGuestEmail: boolean
  guestEmail: string
  onGuestEmailChange: (value: string) => void
  userId?: string
  addressData: CheckoutAddressData
  onAddressDataChange: (value: CheckoutAddressData) => void
  onAddressComplete: (address: string, coordinates?: { lat: number; lng: number }) => void
  latitude: number | null
  longitude: number | null
  isCalculatingDelivery: boolean
  deliveryError: string | null
  shopDeliveries: ShopDeliveryMap
}

const FIELD_CLASSES =
  "h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
const LABEL_CLASSES = "text-xs font-bold uppercase tracking-wide text-stone-600 ml-1"

/**
 * Step 1 of checkout: contact details, address, map pin, and the resulting
 * delivery quotes.
 *
 * Split out of components/checkout/checkout-content.tsx, which held this as ~180
 * lines of markup inline. The per-shop quote cards moved further into
 * DeliveryBreakdown.
 */
export function CheckoutShippingSection({
  heading,
  fullName,
  onFullNameChange,
  phone,
  onPhoneChange,
  showGuestEmail,
  guestEmail,
  onGuestEmailChange,
  userId,
  addressData,
  onAddressDataChange,
  onAddressComplete,
  latitude,
  longitude,
  isCalculatingDelivery,
  deliveryError,
  shopDeliveries,
}: CheckoutShippingSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-stone-900">{heading}</h2>
      </div>

      <Card className="border-none shadow-xl shadow-stone-200/40 rounded-2xl md:rounded-3xl bg-white group hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className={LABEL_CLASSES}>
                Full Name *
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => onFullNameChange(e.target.value)}
                required
                className={FIELD_CLASSES}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className={LABEL_CLASSES}>
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                required
                className={FIELD_CLASSES}
                placeholder="+255..."
              />
            </div>
          </div>

          {showGuestEmail && (
            <div className="space-y-2">
              <Label htmlFor="guestEmail" className={LABEL_CLASSES}>
                Email Address *
              </Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => onGuestEmailChange(e.target.value)}
                required
                className={FIELD_CLASSES}
                placeholder="your@email.com"
              />
              <p className="text-[10px] text-stone-400 font-bold px-1 italic">
                We'll send your order confirmation and tracking details here.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-stone-50 space-y-6">
            <TanzaniaAddressForm value={addressData} onChange={onAddressDataChange} onAddressComplete={onAddressComplete} userId={userId} />

            <WebMapPicker
              latitude={latitude}
              longitude={longitude}
              onLocationSelect={(coords) => {
                // handleAddressComplete sets latitude/longitude from these same
                // coords, so setting them here too was a redundant duplicate write.
                const dummyAddress =
                  [addressData.street, addressData.ward, addressData.district, addressData.region].filter(Boolean).join(", ") ||
                  "Selected Pin"
                onAddressComplete(dummyAddress, coords)
              }}
              title="Verify Delivery Location Pin"
            />
          </div>

          {isCalculatingDelivery && (
            <div className="flex items-center gap-3 p-4 bg-stone-900 rounded-xl text-white/90">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="font-medium text-sm">Calculating delivery fee...</span>
            </div>
          )}

          {deliveryError && (
            <div className="flex items-center gap-3 p-4 md:p-6 bg-destructive/5 rounded-2xl md:rounded-[2rem] text-destructive border border-destructive/20">
              <Info className="h-5 w-5 shrink-0" />
              <span className="font-bold text-xs md:text-sm">{deliveryError}</span>
            </div>
          )}

          <DeliveryBreakdown shopDeliveries={shopDeliveries} />
        </CardContent>
      </Card>
    </section>
  )
}
