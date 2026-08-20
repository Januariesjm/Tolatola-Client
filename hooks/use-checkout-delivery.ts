"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { calculateDeliveryDistanceByCoords, type TransportMethod } from "@/app/actions/maps"
import { clientApiGet } from "@/lib/api-client"
import { calculateFee } from "@/lib/checkout/delivery"
import { groupCartByShop, repriceShopDeliveries, shopWeights, type ShopDelivery } from "@/lib/checkout/delivery-grouping"
import { logger } from "@/lib/logger"
import type { CartItem } from "@/lib/types/checkout"

const log = logger.child("checkout.delivery")

/** Insurance is a flat percentage of goods plus delivery. */
export const INSURANCE_RATE = 0.015

/**
 * Cart loading, transport methods, per-shop delivery quoting and the order
 * totals for checkout.
 *
 * Extracted from components/checkout/checkout-content.tsx, which was 1000 lines
 * of this logic interleaved with the address/payment form and its markup.
 * Pulling it out makes the delivery-quoting paths -- including the two error
 * branches, which had no coverage -- testable without rendering the form.
 */
export function useCheckoutDelivery() {
  const router = useRouter()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [fullAddress, setFullAddress] = useState("")
  const [transportMethods, setTransportMethods] = useState<TransportMethod[]>([])
  const [selectedTransportId, setSelectedTransportId] = useState<string>("")
  const [shopDeliveries, setShopDeliveries] = useState<
    Record<
      string,
      {
        distanceKm: number
        deliveryFee: number
        duration?: string
        transportMethod?: string
        transportMethodId?: string | null
        shopName: string
        shopLat: number
        shopLng: number
        deliveryAvailable?: boolean
      }
    >
  >({})
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)

  /** Set before a deliberate redirect so the empty-cart guard does not fire. */
  const isNavigatingAway = useRef(false)

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("cart") || "[]")
    if (items.length === 0 && !isNavigatingAway.current) {
      router.push("/cart")
    }
    setCartItems(items)

    clientApiGet<{ data: TransportMethod[] }>("transport-methods")
      .then((res) => {
        const methods = res.data || []
        setTransportMethods(methods)
        if (methods.length > 0 && !selectedTransportId) {
          setSelectedTransportId(methods[0].id)
        }
      })
      .catch(() => {
        setTransportMethods([])
      })
  }, [router])

  const handleAddressComplete = async (address: string, coordinates?: { lat: number; lng: number }) => {
    setFullAddress(address)
    setDeliveryError(null)

    if (!coordinates) return
    setLatitude(coordinates.lat)
    setLongitude(coordinates.lng)

    setIsCalculatingDelivery(true)

    const newShopDeliveries: Record<string, ShopDelivery> = {}

    try {
      const shopsData = groupCartByShop(cartItems)

      const method = transportMethods.find((m) => m.id === selectedTransportId || m.name === selectedTransportId) || transportMethods[0]

      for (const sId in shopsData) {
        const shop = shopsData[sId]
        const result = await calculateDeliveryDistanceByCoords(coordinates.lat, coordinates.lng, shop.lat, shop.lng)

        if (result) {
          const fee = calculateFee(method, result.distanceKm, shop.weight, shop.deliveryAvailable !== false)

          newShopDeliveries[sId] = {
            ...result,
            lat: coordinates.lat,
            lng: coordinates.lng,
            deliveryFee: fee,
            transportMethod: shop.deliveryAvailable ? method?.name : "Store Pickup",
            transportMethodId: shop.deliveryAvailable ? method?.id : null,
            shopName: shop.name,
            shopLat: shop.lat,
            shopLng: shop.lng,
            deliveryAvailable: shop.deliveryAvailable,
          }
        }
      }

      if (Object.keys(newShopDeliveries).length > 0) {
        setShopDeliveries(newShopDeliveries)
      } else {
        setDeliveryError("Logistics Engine could not determine routes to your location from the shops.")
      }
    } catch (error) {
      log.error("delivery calculation failed", error, { shopCount: Object.keys(cartItems).length })
      setDeliveryError("Logistics calculation failed. Please retry location selection.")
      setShopDeliveries({})
    } finally {
      setIsCalculatingDelivery(false)
    }
  }

  useEffect(() => {
    if (Object.keys(shopDeliveries).length > 0 && selectedTransportId && cartItems.length > 0) {
      const method = transportMethods.find((m) => m.id === selectedTransportId || m.name === selectedTransportId) || transportMethods[0]

      setShopDeliveries(repriceShopDeliveries(shopDeliveries, shopWeights(cartItems), method))
    }
  }, [selectedTransportId, cartItems])

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const deliveryFee = Object.values(shopDeliveries).reduce((sum, d) => sum + d.deliveryFee, 0)
  const insuranceFee = Math.round((subtotal + deliveryFee) * INSURANCE_RATE)
  const total = subtotal + deliveryFee + insuranceFee

  return {
    cartItems,
    latitude,
    longitude,
    fullAddress,
    transportMethods,
    selectedTransportId,
    setSelectedTransportId,
    shopDeliveries,
    isCalculatingDelivery,
    deliveryError,
    isNavigatingAway,
    handleAddressComplete,
    subtotal,
    deliveryFee,
    insuranceFee,
    total,
  }
}

export type CheckoutDeliveryState = ReturnType<typeof useCheckoutDelivery>
