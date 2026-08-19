export interface CheckoutUser {
  id: string
  email?: string
  full_name?: string
  phone?: string
  region?: string
  district?: string
  ward?: string
  street_address?: string
}

export interface SelectedColor {
  name: string
  image?: string
}

export interface CartProduct {
  id: string
  name: string
  price: number
  images?: string[]
  shop_id?: string
  shop_name?: string
  shop_latitude?: number
  shop_longitude?: number
  weight?: number
  weight_kg?: number
  delivery_available?: boolean
  shops?: {
    name?: string
    latitude?: number
    longitude?: number
    region?: string
    district?: string
  }
}

export interface CartItem {
  product_id: string
  quantity: number
  product: CartProduct
  selected_color?: SelectedColor
  selected_size?: string
}

export interface ShopDeliveryInfo {
  fee: number
  transportMethod: string
  transportMethodId: string
  isCalculating: boolean
  isAvailable: boolean
  originCoords?: {
    lat: number
    lng: number
  }
  distanceKm?: number
  shopName?: string
}

export interface CardDetails {
  number: string
  expiry: string
  cvv: string
}

export type PaymentMethod =
  | "cash"
  | "m-pesa"
  | "mixby-yabx"
  | "visa"
  | "mastercard"
  | "crdb-simbanking"
  | "crdb-internet-banking"
  | "crdb-wakala"
  | "crdb-branch-otc"
  | string

export interface CheckoutContentProps {
  user: CheckoutUser | null
}
