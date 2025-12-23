import { createClient } from "@/lib/supabase/server"

/**
 * Product Service - Business logic layer
 * Can be extracted to separate microservice later
 */
export class ProductService {
  async getProducts(filters?: {
    category?: string
    minPrice?: number
    maxPrice?: number
    search?: string
  }) {
    const supabase = await createClient()

    let query = supabase
      .from("products")
      .select(`
        *,
        shops (
          id,
          name,
          logo_url
        ),
        categories (
          id,
          name
        )
      `)
      .eq("approval_status", "approved")

    if (filters?.category) {
      query = query.eq("category_id", filters.category)
    }

    if (filters?.minPrice) {
      query = query.gte("price", filters.minPrice)
    }

    if (filters?.maxPrice) {
      query = query.lte("price", filters.maxPrice)
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`)
    }

    const { data } = await query
    return data || []
  }

  async getProduct(productId: string) {
    const supabase = await createClient()

    const { data } = await supabase
      .from("products")
      .select(`
        *,
        shops (
          id,
          name,
          logo_url,
          phone
        ),
        categories (
          id,
          name
        )
      `)
      .eq("id", productId)
      .single()

    return data
  }

  async updateStock(productId: string, quantity: number) {
    const supabase = await createClient()

    return await supabase.from("products").update({ stock_quantity: quantity }).eq("id", productId)
  }
}
