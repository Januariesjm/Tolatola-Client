/**
 * Product and review shapes as the product detail page receives them.
 *
 * Derived from the fields the UI actually reads, not from an idealised schema.
 * Almost everything past `id`/`name`/`price` is optional because the catalogue
 * spans very different categories -- fashion has colors and sizes, vehicles have
 * mileage and transmission, food has prep time and dietary info -- and a given
 * row only carries the attributes for its own category.
 *
 * Joined relations (`categories`, `shops`) are optional/nullable because the
 * backend only includes them when the query selects them.
 */

/** Joined `categories` row. */
export interface ProductCategory {
  name?: string | null
  slug?: string | null
}

/** Joined `shops` row: where the product is sold from. */
export interface ProductShop {
  id?: string
  name?: string | null
  address?: string | null
  ward?: string | null
  district?: string | null
  region?: string | null
}

/** One selectable colourway. Some colourways carry their own price. */
export interface ProductColor {
  name: string
  image?: string | null
  price?: number | null
}

export interface Product {
  id: string
  name: string
  price: number
  description?: string | null
  images?: string[] | null
  sku?: string | null
  brand?: string | null
  condition?: string | null
  location?: string | null
  stock_quantity?: number | null
  /** Minimum order quantity. */
  moq?: number | null
  unit?: string | null
  weight_unit?: string | null
  delivery_available?: boolean | null

  categories?: ProductCategory | null
  /** Flattened category name, present on some list endpoints instead of the join. */
  category_name?: string | null
  shops?: ProductShop | null

  // Fashion
  colors?: ProductColor[] | null
  sizes?: string[] | null
  /** Per-size price overrides, keyed by size label. */
  size_prices?: Record<string, number> | null

  // Vehicles / parts
  vehicle_section?: string | null
  year?: number | null
  mileage?: number | null
  transmission?: string | null
  fuel_type?: string | null
  engine_size?: string | null
  model?: string | null
  part_number?: string | null
  compatibility?: string | null

  // Food and drink
  drink_section?: string | null
  prep_time?: string | null
  dietary_info?: string | null

  quality_grade?: string | null
}

/** Author of a review, joined from `users`. */
export interface ReviewAuthor {
  full_name?: string | null
}

export interface Review {
  id: string
  rating: number
  comment?: string | null
  created_at: string
  users?: ReviewAuthor | null
}

/**
 * Trimmed product shape returned by
 * `GET /products/:id/recommendations` -- enough to render a card.
 */
export interface RecommendedProduct {
  id: string
  name: string
  price: number
  images?: string[] | null
  weight_unit?: string | null
}

/**
 * One line item as stored in the localStorage cart.
 *
 * The index signature stays because other parts of the app write additional
 * fields onto cart entries; the named fields are the ones the product page
 * reads and writes.
 */
export interface CartItem {
  product_id: string
  quantity?: number
  selected_color?: ProductColor | null
  selected_size?: string | null
  /** Snapshot of the product at the time it was added, with resolved price. */
  product?: (Product & { price: number }) | null
  [key: string]: unknown
}
