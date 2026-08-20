/**
 * @jest-environment node
 */

/**
 * Tests for the permanent verification token signer (lib/tokenSigner.ts).
 *
 * These tokens never expire and are emailed to users, so the important
 * properties are: a tampered payload must not verify, the email must be
 * normalized consistently on both sides, and malformed input must return null
 * rather than throw.
 */

import {
  generatePermanentVerifyToken,
  verifyPermanentVerifyToken,
} from "@/lib/tokenSigner"

const ORIGINAL_ENV = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

function setEnv(key: keyof typeof ORIGINAL_ENV, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

beforeEach(() => {
  setEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-secret")
  setEnv("JWT_SECRET", undefined)
  setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined)
})

afterAll(() => {
  for (const key of Object.keys(ORIGINAL_ENV) as Array<keyof typeof ORIGINAL_ENV>) {
    setEnv(key, ORIGINAL_ENV[key])
  }
})

describe("generatePermanentVerifyToken", () => {
  it("produces a payload.hmac pair", () => {
    const token = generatePermanentVerifyToken("user-1", "a@b.com")

    expect(token.split(".")).toHaveLength(2)
  })

  it("is deterministic for the same input and secret", () => {
    expect(generatePermanentVerifyToken("user-1", "a@b.com")).toBe(
      generatePermanentVerifyToken("user-1", "a@b.com"),
    )
  })

  it("normalizes the email, so casing and padding do not change the token", () => {
    const canonical = generatePermanentVerifyToken("user-1", "a@b.com")

    expect(generatePermanentVerifyToken("user-1", "  A@B.COM  ")).toBe(canonical)
  })

  it("differs when the user id differs", () => {
    expect(generatePermanentVerifyToken("user-1", "a@b.com")).not.toBe(
      generatePermanentVerifyToken("user-2", "a@b.com"),
    )
  })

  it("differs when the secret changes", () => {
    const before = generatePermanentVerifyToken("user-1", "a@b.com")
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "a-different-secret")

    expect(generatePermanentVerifyToken("user-1", "a@b.com")).not.toBe(before)
  })
})

describe("verifyPermanentVerifyToken", () => {
  it("round-trips a freshly generated token", () => {
    const token = generatePermanentVerifyToken("user-1", "a@b.com")

    expect(verifyPermanentVerifyToken(token)).toEqual({ u: "user-1", e: "a@b.com" })
  })

  it("returns the normalized email, not the input casing", () => {
    const token = generatePermanentVerifyToken("user-1", "MiXeD@Case.COM")

    expect(verifyPermanentVerifyToken(token)?.e).toBe("mixed@case.com")
  })

  it("verifies the same token repeatedly (tokens are multi-use by design)", () => {
    const token = generatePermanentVerifyToken("user-1", "a@b.com")

    expect(verifyPermanentVerifyToken(token)).not.toBeNull()
    expect(verifyPermanentVerifyToken(token)).not.toBeNull()
    expect(verifyPermanentVerifyToken(token)).not.toBeNull()
  })

  it("rejects a token signed with a different secret", () => {
    const token = generatePermanentVerifyToken("user-1", "a@b.com")
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "rotated-secret")

    expect(verifyPermanentVerifyToken(token)).toBeNull()
  })

  it("rejects a payload swapped onto another token's signature", () => {
    const victim = generatePermanentVerifyToken("user-1", "victim@b.com")
    const attacker = generatePermanentVerifyToken("user-2", "attacker@b.com")

    const forged = `${attacker.split(".")[0]}.${victim.split(".")[1]}`

    expect(verifyPermanentVerifyToken(forged)).toBeNull()
  })

  it("rejects a token whose payload was edited to escalate to another user", () => {
    const token = generatePermanentVerifyToken("user-1", "a@b.com")
    const [, hmac] = token.split(".")
    const tamperedPayload = Buffer.from(
      JSON.stringify({ u: "admin-1", e: "a@b.com" }),
      "utf8",
    ).toString("base64url")

    expect(verifyPermanentVerifyToken(`${tamperedPayload}.${hmac}`)).toBeNull()
  })

  it.each([
    ["an empty string", ""],
    ["a token with no separator", "abcdef"],
    ["a token with too many parts", "a.b.c"],
    ["a non-base64 payload", "!!!!.deadbeef"],
    ["a payload that is not JSON", `${Buffer.from("nope").toString("base64url")}.deadbeef`],
  ])("returns null for %s without throwing", (_label, token) => {
    expect(() => verifyPermanentVerifyToken(token)).not.toThrow()
    expect(verifyPermanentVerifyToken(token)).toBeNull()
  })

  it.each([
    ["missing u", { e: "a@b.com" }],
    ["missing e", { u: "user-1" }],
    ["both empty", { u: "", e: "" }],
  ])("returns null when the payload is %s", (_label, payload) => {
    const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")

    expect(verifyPermanentVerifyToken(`${encoded}.deadbeef`)).toBeNull()
  })

  it.each([[null], [undefined], [123], [{}]])(
    "returns null for the non-string input %p",
    (input) => {
      expect(verifyPermanentVerifyToken(input as never)).toBeNull()
    },
  )

  it("rejects a signature of the wrong length without throwing", () => {
    // timingSafeEqual throws on mismatched buffer lengths, so the length guard
    // must run first.
    const token = generatePermanentVerifyToken("user-1", "a@b.com")
    const [payload] = token.split(".")

    expect(() => verifyPermanentVerifyToken(`${payload}.short`)).not.toThrow()
    expect(verifyPermanentVerifyToken(`${payload}.short`)).toBeNull()
  })
})

describe("secret selection", () => {
  it("falls back to JWT_SECRET when the service role key is absent", () => {
    setEnv("SUPABASE_SERVICE_ROLE_KEY", undefined)
    setEnv("JWT_SECRET", "jwt-secret-value")

    const token = generatePermanentVerifyToken("user-1", "a@b.com")
    expect(verifyPermanentVerifyToken(token)).toEqual({ u: "user-1", e: "a@b.com" })

    // A token minted under JWT_SECRET must not verify under a different secret.
    setEnv("JWT_SECRET", "another-jwt-secret")
    expect(verifyPermanentVerifyToken(token)).toBeNull()
  })

  it("falls back to the anon key when neither of the first two is set", () => {
    setEnv("SUPABASE_SERVICE_ROLE_KEY", undefined)
    setEnv("JWT_SECRET", undefined)
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-value")

    const token = generatePermanentVerifyToken("user-1", "a@b.com")

    expect(verifyPermanentVerifyToken(token)).toEqual({ u: "user-1", e: "a@b.com" })
  })
})
