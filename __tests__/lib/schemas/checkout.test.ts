import { checkoutOrderSchema, orderResponseSchema } from "@/lib/schemas/checkout"

describe("Checkout Zod Schemas (lib/schemas/checkout.ts)", () => {
  const validOrder = {
    full_name: "Ali Hassan",
    phone: "+255788123456",
    email: "ali@example.com",
    payment_method: "airtel-money",
    items: [
      {
        product_id: "prod-1",
        quantity: 2,
        price: 15000,
        selected_color: { name: "Red" },
      },
    ],
    subtotal: 30000,
    delivery_fee: 3000,
    insurance_fee: 450,
    total_amount: 33450,
    address: {
      country: "Tanzania",
      region: "Dar es Salaam",
      district: "Kinondoni",
      ward: "Kijitonyama",
    },
  }

  describe("checkoutOrderSchema", () => {
    it("validates complete order payload", () => {
      const result = checkoutOrderSchema.safeParse(validOrder)
      expect(result.success).toBe(true)
    })

    it("rejects order with empty items array", () => {
      const emptyItemsOrder = { ...validOrder, items: [] }
      const result = checkoutOrderSchema.safeParse(emptyItemsOrder)
      expect(result.success).toBe(false)
    })

    it("rejects order with zero total amount", () => {
      const zeroTotalOrder = { ...validOrder, total_amount: 0 }
      const result = checkoutOrderSchema.safeParse(zeroTotalOrder)
      expect(result.success).toBe(false)
    })

    it("rejects order with missing region or district", () => {
      const missingAddressOrder = {
        ...validOrder,
        address: { country: "Tanzania", region: "", district: "" },
      }
      const result = checkoutOrderSchema.safeParse(missingAddressOrder)
      expect(result.success).toBe(false)
    })
  })

  describe("orderResponseSchema", () => {
    it("validates successful order response", () => {
      const response = {
        success: true,
        order_id: "ord-99",
        order_number: "TOLA-ORD-99",
        message: "Order placed successfully",
      }

      const result = orderResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })

    it("validates error order response", () => {
      const errorResponse = {
        success: false,
        error: "Insufficient stock for product",
      }

      const result = orderResponseSchema.safeParse(errorResponse)
      expect(result.success).toBe(true)
    })
  })
})
