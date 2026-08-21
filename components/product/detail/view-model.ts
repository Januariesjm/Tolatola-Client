import type { RefObject } from "react"
import type { useLanguage } from "@/lib/i18n/language-context"
import type { ProductDetailState } from "@/hooks/use-product-detail"
import type { Product, Review } from "@/lib/types/product"

/**
 * The translate function, taken from useLanguage rather than widened to
 * (key: string) => string — the key union is what catches a typo in a
 * translation key at compile time.
 */
type Translate = ReturnType<typeof useLanguage>["t"]

/**
 * Everything the product detail sections render from: the hook's state plus the
 * few view-only concerns the page itself owns (favourite toggle, the scroll
 * anchor, and the translation function).
 *
 * Passed as one prop so the markup could be split into sections without
 * rewriting it or threading two dozen individual props.
 */
export interface ProductDetailViewModel extends ProductDetailState {
  product: Product
  reviews: Review[]
  t: Translate
  isLiked: boolean
  isLoading: boolean
  handleLike: () => Promise<void>
  scrollToTestimony: () => void
  testimonyRef: RefObject<HTMLDivElement>
}
