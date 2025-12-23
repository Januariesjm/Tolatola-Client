const CLICKPESA_API_URL = process.env.CLICKPESA_API_URL || "https://api.clickpesa.com"
const CLICKPESA_CLIENT_ID = process.env.CLICKPESA_CLIENT_ID
const CLICKPESA_API_KEY = process.env.CLICKPESA_API_KEY

export type PaymentMethod =
  | "m-pesa"
  | "airtel-money"
  | "halopesa"
  | "mixx-by-yas"
  | "ezypesa"
  | "crdb-simbanking"
  | "crdb-internet-banking"
  | "crdb-wakala"
  | "crdb-branch-otc"
  | "visa"
  | "mastercard"
  | "unionpay"
  | "cash-on-delivery"

export interface ClickPesaToken {
  success: boolean
  token: string
}

export interface ClickPesaPaymentRequest {
  amount: number
  phone_number?: string
  card_number?: string
  expiry_date?: string
  cvv?: string
  merchant_reference: string
  callback_url: string
}

export interface ClickPesaPaymentResponse {
  success: boolean
  transaction_id: string
  status: string
  message: string
}

export class ClickPesaClient {
  private token: string | null = null
  private tokenExpiry: number | null = null

  async getAuthToken(): Promise<string> {
    // Check if token is still valid (with 5 min buffer)
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
      return this.token
    }

    const response = await fetch(`${CLICKPESA_API_URL}/third-parties/generate-token`, {
      method: "POST",
      headers: {
        "client-id": CLICKPESA_CLIENT_ID!,
        "api-key": CLICKPESA_API_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to generate ClickPesa token")
    }

    const data: ClickPesaToken = await response.json()
    this.token = data.token
    // Token valid for 1 hour
    this.tokenExpiry = Date.now() + 3600000

    return this.token
  }

  async initiateMobileMoneyPayment(
    amount: number,
    phoneNumber: string,
    provider: "m-pesa" | "airtel-money" | "halopesa" | "mixx-by-yas" | "ezypesa",
    merchantReference: string,
    callbackUrl: string,
  ): Promise<ClickPesaPaymentResponse> {
    const token = await this.getAuthToken()

    // Preview the payment first
    const previewResponse = await fetch(`${CLICKPESA_API_URL}/payment/ussd-push/preview`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        amount: amount,
        provider: provider.toUpperCase().replace("-", "_"),
      }),
    })

    if (!previewResponse.ok) {
      const error = await previewResponse.json()
      throw new Error(error.message || "Failed to preview mobile money payment")
    }

    // Initiate the payment
    const paymentResponse = await fetch(`${CLICKPESA_API_URL}/payment/ussd-push/initiate`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        amount: amount,
        provider: provider.toUpperCase().replace("-", "_"),
        merchant_reference: merchantReference,
        callback_url: callbackUrl,
      }),
    })

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json()
      throw new Error(error.message || "Failed to initiate mobile money payment")
    }

    return await paymentResponse.json()
  }

  async initiateCardPayment(
    amount: number,
    cardNumber: string,
    expiryDate: string,
    cvv: string,
    cardType: "visa" | "mastercard" | "unionpay",
    merchantReference: string,
    callbackUrl: string,
  ): Promise<ClickPesaPaymentResponse> {
    const token = await this.getAuthToken()

    // Preview the payment first
    const previewResponse = await fetch(`${CLICKPESA_API_URL}/payment/card/preview`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card_number: cardNumber,
        expiry_date: expiryDate,
        cvv: cvv,
        amount: amount,
      }),
    })

    if (!previewResponse.ok) {
      const error = await previewResponse.json()
      throw new Error(error.message || "Failed to preview card payment")
    }

    // Initiate the payment
    const paymentResponse = await fetch(`${CLICKPESA_API_URL}/payment/card/initiate`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card_number: cardNumber,
        expiry_date: expiryDate,
        cvv: cvv,
        amount: amount,
        merchant_reference: merchantReference,
        callback_url: callbackUrl,
      }),
    })

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json()
      throw new Error(error.message || "Failed to initiate card payment")
    }

    return await paymentResponse.json()
  }

  async queryPaymentStatus(transactionId: string): Promise<any> {
    const token = await this.getAuthToken()

    const response = await fetch(`${CLICKPESA_API_URL}/payment/query?transaction_id=${transactionId}`, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to query payment status")
    }

    return await response.json()
  }
}

export const clickpesa = new ClickPesaClient()
