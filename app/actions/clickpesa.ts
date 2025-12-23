"use server"

import { PaymentService } from "@/lib/services/payment.service"
import type { PaymentMethod } from "@/lib/clickpesa"

const paymentService = new PaymentService()

export async function initiatePayment(
  orderId: string,
  paymentMethod: PaymentMethod,
  paymentDetails: {
    phoneNumber?: string
    cardNumber?: string
    expiryDate?: string
    cvv?: string
  },
) {
  return await paymentService.initiatePayment(orderId, paymentMethod, paymentDetails)
}

export async function checkPaymentStatus(transactionId: string) {
  return await paymentService.verifyPayment(transactionId)
}
