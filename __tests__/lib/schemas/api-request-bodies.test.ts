/**
 * Tests for the request-body schemas added to lib/schemas/api.ts.
 *
 * The pre-existing role/payout schemas are covered in api.test.ts; this file
 * covers the schemas for the routes that were previously reading
 * `request.json()` unvalidated.
 *
 * The KYC block is the one that matters most: it documents that `user_id` is
 * stripped, which is what stops a caller reassigning their KYC record to
 * another user.
 */

import {
  assignTransporterSchema,
  clickpesaWebhookSchema,
  customerKycSubmitSchema,
  kycNotificationSchema,
  profileUpdateSchema,
  registrationRecoveryCompleteSchema,
  registrationRecoverySaveSchema,
  transporterUpdateSchema,
  validationSurveySchema,
} from "@/lib/schemas/api"

describe("assignTransporterSchema", () => {
  it("accepts a transporter id", () => {
    expect(assignTransporterSchema.safeParse({ transporterId: "t-1" }).success).toBe(true)
  })

  it.each([{}, { transporterId: "" }, { transporterId: null }, { transporterId: 42 }])("rejects %j", (body) => {
    expect(assignTransporterSchema.safeParse(body).success).toBe(false)
  })

  it("names the missing field so the 400 is actionable", () => {
    const parsed = assignTransporterSchema.safeParse({})

    expect(parsed.success).toBe(false)
    expect(parsed.success === false && parsed.error.issues[0].path).toEqual(["transporterId"])
  })
})

describe("profileUpdateSchema", () => {
  it("accepts a full profile", () => {
    expect(profileUpdateSchema.safeParse({ full_name: "Amina Juma", phone: "+255711223344", address: "Mikocheni" }).success).toBe(true)
  })

  it("accepts a name on its own", () => {
    expect(profileUpdateSchema.safeParse({ full_name: "Amina Juma" }).success).toBe(true)
  })

  it("rejects an empty name, which would blank the profile", () => {
    expect(profileUpdateSchema.safeParse({ full_name: "" }).success).toBe(false)
  })

  it("rejects a non-string phone", () => {
    expect(profileUpdateSchema.safeParse({ full_name: "Amina", phone: 255711223344 }).success).toBe(false)
  })

  it("strips keys the route does not write", () => {
    const parsed = profileUpdateSchema.safeParse({ full_name: "Amina", role: "admin", id: "other-user" })

    expect(parsed.success && parsed.data).toEqual({ full_name: "Amina" })
  })
})

describe("transporterUpdateSchema", () => {
  it("accepts full transporter details", () => {
    expect(
      transporterUpdateSchema.safeParse({ business_name: "Tola Movers", vehicle_type: "boda", license_plate: "T123ABC" }).success,
    ).toBe(true)
  })

  it("rejects a missing business name", () => {
    expect(transporterUpdateSchema.safeParse({ vehicle_type: "boda" }).success).toBe(false)
  })

  it("strips keys the route does not write", () => {
    const parsed = transporterUpdateSchema.safeParse({ business_name: "Tola Movers", kyc_status: "approved" })

    expect(parsed.success && parsed.data).not.toHaveProperty("kyc_status")
  })
})

describe("customerKycSubmitSchema", () => {
  const VALID = {
    full_name: "Amina Juma",
    date_of_birth: "1995-04-02",
    phone_number: "+255711223344",
    address: "Plot 12",
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    postal_code: "11000",
    id_type: "nida",
    id_number: "19950402-12345-00001-23",
    id_document_front_url: "https://cdn/front.jpg",
    id_document_back_url: "https://cdn/back.jpg",
    selfie_url: "https://cdn/selfie.jpg",
  }

  it("accepts the form's full payload", () => {
    expect(customerKycSubmitSchema.safeParse(VALID).success).toBe(true)
  })

  it("accepts a partially-filled form, which the UI saves as progress", () => {
    expect(customerKycSubmitSchema.safeParse({ full_name: "Amina Juma" }).success).toBe(true)
  })

  it("rejects a submission with no name", () => {
    expect(customerKycSubmitSchema.safeParse({ id_number: "123" }).success).toBe(false)
  })

  it("strips user_id, so the column can only come from the session", () => {
    // The route spread the whole body into a Supabase update whose only filter
    // was the caller's own user_id. A body carrying someone else's user_id
    // reassigned the record to them.
    const parsed = customerKycSubmitSchema.safeParse({ ...VALID, user_id: "another-users-id" })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data).not.toHaveProperty("user_id")
  })

  it("strips kyc_status, so a caller cannot self-approve", () => {
    const parsed = customerKycSubmitSchema.safeParse({ ...VALID, kyc_status: "approved" })

    expect(parsed.success && parsed.data).not.toHaveProperty("kyc_status")
  })

  it("strips kyc_notes", () => {
    const parsed = customerKycSubmitSchema.safeParse({ ...VALID, kyc_notes: "looks fine to me" })

    expect(parsed.success && parsed.data).not.toHaveProperty("kyc_notes")
  })

  it("keeps every field the form owns", () => {
    const parsed = customerKycSubmitSchema.safeParse(VALID)

    expect(parsed.success && Object.keys(parsed.data).sort()).toEqual(Object.keys(VALID).sort())
  })
})

describe("kycNotificationSchema", () => {
  it("accepts an approval notice", () => {
    expect(kycNotificationSchema.safeParse({ email: "amina@example.com", fullName: "Amina Juma" }).success).toBe(true)
  })

  it("accepts a rejection notice with a reason", () => {
    expect(
      kycNotificationSchema.safeParse({ email: "amina@example.com", fullName: "Amina Juma", reason: "Blurred ID photo" }).success,
    ).toBe(true)
  })

  it("rejects a malformed email, which would be handed to the mail provider", () => {
    expect(kycNotificationSchema.safeParse({ email: "amina-at-example", fullName: "Amina" }).success).toBe(false)
  })

  it("rejects a missing name", () => {
    expect(kycNotificationSchema.safeParse({ email: "amina@example.com" }).success).toBe(false)
  })
})

describe("clickpesaWebhookSchema", () => {
  const VALID = {
    merchant_reference: "ORDER-abc123",
    status: "COMPLETED",
    transaction_id: "txn-1",
    amount: 29435,
    phone_number: "255711223344",
  }

  it("accepts a completed payment callback", () => {
    expect(clickpesaWebhookSchema.safeParse(VALID).success).toBe(true)
  })

  it("accepts a callback with only the two fields the handler reads", () => {
    expect(clickpesaWebhookSchema.safeParse({ merchant_reference: "ORDER-abc123", status: "PENDING" }).success).toBe(true)
  })

  it("rejects a callback with no merchant reference, which is the order id", () => {
    expect(clickpesaWebhookSchema.safeParse({ status: "COMPLETED" }).success).toBe(false)
  })

  it("rejects a callback with no status, which decides whether the order is paid", () => {
    expect(clickpesaWebhookSchema.safeParse({ merchant_reference: "ORDER-abc123" }).success).toBe(false)
  })

  it("accepts an amount sent as a string", () => {
    // ClickPesa is inconsistent about this between callback types.
    expect(clickpesaWebhookSchema.safeParse({ ...VALID, amount: "29435.00" }).success).toBe(true)
  })

  it("tolerates unknown fields the provider adds", () => {
    expect(clickpesaWebhookSchema.safeParse({ ...VALID, channel: "MPESA", fee: 100 }).success).toBe(true)
  })
})

describe("registrationRecoverySaveSchema", () => {
  it("accepts a progress save", () => {
    expect(
      registrationRecoverySaveSchema.safeParse({
        session_id: "reg_123_abc",
        user_type: "vendor",
        full_name: "Amina",
        form_data: { step: 2, business: "Tola" },
      }).success,
    ).toBe(true)
  })

  it("accepts a session id on its own", () => {
    expect(registrationRecoverySaveSchema.safeParse({ session_id: "reg_123_abc" }).success).toBe(true)
  })

  it("rejects a save with no session to attach it to", () => {
    expect(registrationRecoverySaveSchema.safeParse({ user_type: "vendor" }).success).toBe(false)
  })

  it("rejects a non-object form_data", () => {
    expect(registrationRecoverySaveSchema.safeParse({ session_id: "reg_1", form_data: "step-2" }).success).toBe(false)
  })
})

describe("registrationRecoveryCompleteSchema", () => {
  it("accepts a session id", () => {
    expect(registrationRecoveryCompleteSchema.safeParse({ session_id: "reg_123_abc" }).success).toBe(true)
  })

  it("rejects an empty body", () => {
    expect(registrationRecoveryCompleteSchema.safeParse({}).success).toBe(false)
  })
})

describe("validationSurveySchema", () => {
  const RESPONDENT = { full_name: "Amina Juma", phone: "+255711223344" }

  it("accepts a full submission", () => {
    expect(
      validationSurveySchema.safeParse({
        ...RESPONDENT,
        email: "amina@example.com",
        region: "Dar es Salaam",
        respondent_type: "buyer",
        q3_impact_rating: 4,
        q6_channels: ["whatsapp", "instagram"],
        assisted_by_agent: true,
        agent_name: "Juma",
      }).success,
    ).toBe(true)
  })

  it("accepts a partially-answered survey", () => {
    expect(validationSurveySchema.safeParse(RESPONDENT).success).toBe(true)
  })

  it("rejects a response with no respondent", () => {
    expect(validationSurveySchema.safeParse({ q3_impact_rating: 4 }).success).toBe(false)
  })

  it("rejects a missing phone", () => {
    expect(validationSurveySchema.safeParse({ full_name: "Amina Juma" }).success).toBe(false)
  })

  it("rejects a rating sent as a string", () => {
    expect(validationSurveySchema.safeParse({ ...RESPONDENT, q3_impact_rating: "4" }).success).toBe(false)
  })

  it("rejects a channels value that is not an array of strings", () => {
    expect(validationSurveySchema.safeParse({ ...RESPONDENT, q6_channels: "whatsapp" }).success).toBe(false)
  })
})
