/**
 * An assignment row as `TransporterAssignmentsTab` receives it -- an order
 * offered to, or already claimed by, a transporter, with the shop/order joins
 * the tab renders.
 *
 * Only the fields the tab actually reads. Most are optional because an
 * available-pool row (`is_available_order`) and a claimed assignment carry
 * different joins.
 */
export interface TransporterAssignment {
  id: string
  order_id?: string
  status: string
  is_available_order?: boolean
  accepted_at?: string | null
  picked_up_at?: string | null
  delivered_at?: string | null
  distance_km?: number
  delivery_fee?: number | string
  transport_methods?: { name?: string } | null
  shops?: {
    name?: string
    district?: string
    region?: string
    address?: string
    phone?: string
    latitude?: number
    longitude?: number
    vendors?: { user_id?: string } | null
  } | null
  orders?: {
    order_number?: string
    customer_id?: string
    users?: { full_name?: string; phone?: string } | null
    shipping_address?: {
      full_name?: string
      district?: string
      region?: string
      street?: string
      address?: string
      ward?: string
      village?: string
      latitude?: number
      longitude?: number
    } | null
  } | null
}
