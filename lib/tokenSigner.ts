import crypto from "crypto"

function getSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.JWT_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "tolatola-permanent-verification-secret-key-2026"
  )
}

export interface VerifyTokenPayload {
  u: string // userId
  e: string // email
}

/**
 * Generate a non-expiring, multi-clickable HMAC-signed verification token.
 */
export function generatePermanentVerifyToken(userId: string, email: string): string {
  const cleanEmail = email.trim().toLowerCase()
  const payloadStr = JSON.stringify({ u: userId, e: cleanEmail })
  const payloadBase64 = Buffer.from(payloadStr, "utf8").toString("base64url")

  const secret = getSecret()
  const hmac = crypto.createHmac("sha256", secret).update(`${userId}:${cleanEmail}`).digest("hex")

  return `${payloadBase64}.${hmac}`
}

/**
 * Verify a permanent verification token. Returns payload if valid, null if invalid.
 */
export function verifyPermanentVerifyToken(token: string): VerifyTokenPayload | null {
  try {
    if (!token || typeof token !== "string") return null

    const parts = token.split(".")
    if (parts.length !== 2) return null

    const [payloadBase64, hmac] = parts
    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf8")
    const payload: VerifyTokenPayload = JSON.parse(payloadStr)

    if (!payload.u || !payload.e) return null

    const secret = getSecret()
    const expectedHmac = crypto.createHmac("sha256", secret).update(`${payload.u}:${payload.e.trim().toLowerCase()}`).digest("hex")

    if (hmac.length !== expectedHmac.length) return null

    const valid = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))
    if (valid) {
      return payload
    }
  } catch (e) {
    return null
  }
  return null
}
