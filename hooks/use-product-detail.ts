"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import type { CartItem, Product, ProductColor, RecommendedProduct, Review } from "@/lib/types/product"

const log = logger.child("product.detail")

/** Reads the localStorage cart, tolerating a missing or corrupt value. */
function readCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem("cart") || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // A hand-edited or truncated cart should not break the product page.
    log.warn("cart in localStorage was not valid JSON; treating it as empty")
    return []
  }
}

const cartHasProduct = (cart: CartItem[], productId: string) => cart.some((item) => item.product_id === productId)

/**
 * Data and interaction state for the product detail page: recommendations,
 * cart membership, fashion variant selection, resolved price and add-to-cart.
 *
 * Extracted from components/product/product-detail-content.tsx, which had 857
 * lines of fetching, cart writes and variant rules interleaved with markup, so
 * the pricing and cart-merge rules can be tested without rendering the page.
 */
export function useProductDetail({ product, reviews }: { product: Product; reviews: Review[] }) {
  const { toast } = useToast()

  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([])
  const [recommendationsFailed, setRecommendationsFailed] = useState(false)

  // Lazy initialiser, not an effect. This was previously written as
  // `useState(() => { ...setIsInCart(...) })` -- a state initialiser used for
  // its side effect, which sets state during render.
  const [isInCart, setIsInCart] = useState(() => cartHasProduct(readCart(), product.id))

  useEffect(() => {
    const fetchRecommendations = async () => {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "")
      try {
        const res = await fetch(`${baseUrl}/products/${product.id}/recommendations`)
        if (!res.ok) {
          // A non-OK response used to be swallowed silently along with thrown
          // errors, so a broken recommendations endpoint looked identical to a
          // product that simply has no recommendations.
          throw new Error(`recommendations request failed with ${res.status}`)
        }
        const json = await res.json()
        setRecommendations(json.data || [])
        setRecommendationsFailed(false)
      } catch (error) {
        log.error("failed to load recommendations", error, { productId: product.id })
        setRecommendations([])
        setRecommendationsFailed(true)
      }
    }
    fetchRecommendations()
  }, [product.id])

  useEffect(() => {
    const loadCart = () => setIsInCart(cartHasProduct(readCart(), product.id))

    window.addEventListener("cartUpdated", loadCart)
    return () => window.removeEventListener("cartUpdated", loadCart)
  }, [product.id])

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0

  const isFashion =
    product.categories?.name?.toLowerCase() === "fashion" ||
    product.category_name?.toLowerCase() === "fashion" ||
    ["men", "women", "kids"].includes(product.categories?.name?.toLowerCase() || "") ||
    ["men", "women", "kids"].includes(product.category_name?.toLowerCase() || "") ||
    (product.colors && product.colors.length > 0) ||
    (product.sizes && product.sizes.length > 0)

  const isService =
    product.categories?.slug === "services" ||
    product.categories?.name?.toLowerCase() === "services" ||
    product.category_name?.toLowerCase() === "services"

  useEffect(() => {
    if (isFashion) {
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        setSelectedColor(product.colors[0])
        if (product.colors[0].image) {
          setSelectedImageUrl(product.colors[0].image)
        }
      }
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        setSelectedSize(product.sizes[0])
      }
    }
  }, [product, isFashion, selectedColor, selectedSize])

  /** A size override wins over a colour price, which wins over the base price. */
  const resolvedPrice =
    isFashion && selectedSize && product.size_prices?.[selectedSize]
      ? product.size_prices[selectedSize]
      : isFashion && selectedColor?.price
        ? selectedColor.price
        : product.price

  const handleAddToCart = async () => {
    if (isFashion) {
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        toast({
          title: "Select Color",
          description: "Please select a color option.",
          variant: "destructive",
        })
        return
      }
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        toast({
          title: "Select Size",
          description: "Please select a size option.",
          variant: "destructive",
        })
        return
      }
    }

    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = cartItems.find(
      (item: CartItem) =>
        item.product_id === product.id &&
        (!isFashion ||
          ((!item.selected_color || item.selected_color?.name === selectedColor?.name) &&
            (!item.selected_size || item.selected_size === selectedSize))),
    )

    if (existingItem) {
      existingItem.quantity += quantity
      if (existingItem.product) {
        existingItem.product.price = resolvedPrice
      }
    } else {
      cartItems.push({
        product_id: product.id,
        quantity,
        selected_color: selectedColor,
        selected_size: selectedSize,
        product: {
          ...product,
          price: resolvedPrice,
          shops: product.shops,
          categories: product.categories,
        },
      })
    }

    localStorage.setItem("cart", JSON.stringify(cartItems))
    setIsInCart(true)
    window.dispatchEvent(new Event("cartUpdated"))

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  /**
   * Single source of truth for the hero image. The original guard checked
   * `product.images?.[0] || selectedImageUrl` while the src read
   * `product.images[selectedImageIndex]`, so an out-of-range index rendered
   * src={undefined}.
   */
  const displayedImage = selectedImageUrl || product.images?.[selectedImageIndex] || product.images?.[0] || null

  const productLocation =
    product.location ||
    [product.shops?.ward, product.shops?.district, product.shops?.region].filter(Boolean).join(", ") ||
    product.shops?.address ||
    product.shops?.region ||
    null

  return {
    quantity,
    setQuantity,
    selectedImageIndex,
    setSelectedImageIndex,
    isZoomed,
    setIsZoomed,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    selectedImageUrl,
    setSelectedImageUrl,
    recommendations,
    recommendationsFailed,
    isInCart,
    averageRating,
    isFashion,
    isService,
    resolvedPrice,
    displayedImage,
    productLocation,
    handleAddToCart,
  }
}

export type ProductDetailState = ReturnType<typeof useProductDetail>
