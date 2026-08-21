import { createClient } from "@/lib/supabase/server"
import { ClickPesaClient, type PaymentMethod } from "@/lib/clickpesa"
import { normalizeError } from "@/lib/logger"
import { logger } from "@/lib/logger"

const log = logger.child("lib.services.payment.service")

/**
 * Payment Service - Handles all payment-related business logic
 * This service can be extracted to a separate microservice when needed
 */
/** Mobile money providers ClickPesa accepts for a USSD push. */
type MobileMoneyMethod = "m-pesa" | "airtel-money" | "halopesa" | "mixx-by-yas" | "ezypesa"

/** Card networks ClickPesa accepts. */
type CardMethod = "visa" | "mastercard" | "unionpay"

/** The ClickPesa webhook body, as far as this service reads it. */
export interface PaymentWebhookPayload {
  transaction_id?: string
  status?: string
  merchant_reference?: string
}

export class PaymentService {
  private clickpesa: ClickPesaClient

  constructor() {
    this.clickpesa = new ClickPesaClient()
  }

  async initiatePayment(
    orderId: string,
    paymentMethod: PaymentMethod,
    paymentDetails: {
      phoneNumber?: string
      cardNumber?: string
      expiryDate?: string
      cvv?: string
    },
  ) {
    try {
      const supabase = await createClient()

      // Get order details
      const { data: order, error: orderError } = await supabase.from("orders").select("*, users(email)").eq("id", orderId).single()

      if (orderError || !order) {
        throw new Error("Order not found")
      }

      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://tolatola.co"}/api/webhooks/clickpesa`
      const merchantReference = `ORDER-${orderId}`

      // Handle Cash on Delivery
      if (paymentMethod === "cash-on-delivery") {
        await supabase
          .from("orders")
          .update({
            payment_method: paymentMethod,
            payment_status: "pending",
            status: "pending",
          })
          .eq("id", orderId)

        return {
          success: true,
          message: "Order placed successfully. Pay cash upon delivery.",
          requiresPayment: false,
        }
      }

      let result

      // Mobile Money payments
      if (["m-pesa", "airtel-money", "halopesa", "mixx-by-yas", "ezypesa"].includes(paymentMethod)) {
        if (!paymentDetails.phoneNumber) {
          throw new Error("Phone number is required for mobile money payments")
        }

        result = await this.clickpesa.initiateMobileMoneyPayment(
          order.total_amount,
          paymentDetails.phoneNumber,
          paymentMethod as MobileMoneyMethod,
          merchantReference,
          callbackUrl,
        )
      }
      // Card payments
      else if (["visa", "mastercard", "unionpay"].includes(paymentMethod)) {
        if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
          throw new Error("Card details are required for card payments")
        }

        result = await this.clickpesa.initiateCardPayment(
          order.total_amount,
          paymentDetails.cardNumber,
          paymentDetails.expiryDate,
          paymentDetails.cvv,
          paymentMethod as CardMethod,
          merchantReference,
          callbackUrl,
        )
      }
      // Bank payments
      else if (["crdb-simbanking", "crdb-internet-banking", "crdb-wakala", "crdb-branch-otc"].includes(paymentMethod)) {
        const token = await this.clickpesa.getAuthToken()
        const response = await fetch(`${process.env.CLICKPESA_API_URL || "https://api.clickpesa.com"}/bill-pay/create-order`, {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: order.total_amount,
            merchant_reference: merchantReference,
            callback_url: callbackUrl,
            customer_email: order.users.email,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create bank payment control number")
        }

        result = await response.json()
      }

      // Update order with payment info
      await supabase
        .from("orders")
        .update({
          payment_method: paymentMethod,
          payment_status: "processing",
          clickpesa_transaction_id: result.transaction_id || result.control_number,
        })
        .eq("id", orderId)

      return {
        success: true,
        transactionId: result.transaction_id || result.control_number,
        message: result.message,
        requiresPayment: true,
        controlNumber: result.control_number,
      }
    } catch (error) {
      log.error("payment initiation error", error)
      return {
        success: false,
        error: normalizeError(error).message || "Failed to initiate payment",
      }
    }
  }

  async verifyPayment(transactionId: string) {
    try {
      const result = await this.clickpesa.queryPaymentStatus(transactionId)
      return {
        success: true,
        status: result.status,
        data: result,
      }
    } catch (error) {
      log.error("payment verification error", error)
      return {
        success: false,
        error: normalizeError(error).message || "Failed to verify payment",
      }
    }
  }

  async handleWebhook(payload: PaymentWebhookPayload) {
    const supabase = await createClient()

    try {
      const { status, merchant_reference } = payload

      // Extract order ID from merchant reference
      const orderId = (merchant_reference ?? "").replace("ORDER-", "")

      // Update order status based on payment status
      const orderStatus = status === "COMPLETED" ? "confirmed" : status === "FAILED" ? "cancelled" : "pending"

      await supabase
        .from("orders")
        .update({
          payment_status: status === "COMPLETED" ? "paid" : "failed",
          status: orderStatus,
        })
        .eq("id", orderId)

      return { success: true, message: "Webhook processed successfully" }
    } catch (error) {
      log.error("webhook processing error", error)
      return { success: false, error: normalizeError(error).message }
    }
  }
}
