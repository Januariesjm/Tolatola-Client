/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/kyc/submit.
 *
 * This route spread the whole request body into a Supabase write. The insert
 * path applied `user_id: user.id` after the spread and so was safe, but the
 * update path had no such override -- a body carrying another user's `user_id`
 * reassigned the caller's KYC record to them, and a body carrying
 * `kyc_status: "approved"` self-approved the submission (the status override
 * came before the spread on that path in the original code order).
 *
 * The fix is a schema that omits both fields; Zod strips unknown keys, so they
 * cannot reach the write. These tests pin that.
 */

const mockCreateClient = jest.fn()

jest.mock("@/lib/supabase/server", () => ({ createClient: () => mockCreateClient() }))

import { POST } from "@/app/api/kyc/submit/route"

const VALID_BODY = {
  full_name: "Amina Juma",
  date_of_birth: "1995-04-02",
  phone_number: "+255711223344",
  id_type: "nida",
  id_number: "19950402-12345-00001-23",
}

function jsonRequest(body: unknown) {
  return { json: async () => body } as never
}

/**
 * Supabase double for the "does a KYC row exist" lookup plus the insert/update.
 *
 * `existing` decides which branch the route takes.
 */
function supabaseStub({ user = { id: "u1" }, existing = null as { id: string } | null, writeError = null as unknown } = {}) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: existing })
  const selectEq = jest.fn(() => ({ maybeSingle }))
  const select = jest.fn(() => ({ eq: selectEq }))

  const updateEq = jest.fn().mockResolvedValue({ error: writeError })
  const update = jest.fn(() => ({ eq: updateEq }))
  const insert = jest.fn().mockResolvedValue({ error: writeError })

  return {
    client: {
      from: jest.fn(() => ({ select, update, insert })),
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
    },
    spies: { insert, update, updateEq },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("POST /api/kyc/submit authentication", () => {
  it("returns 401 for an anonymous caller", async () => {
    const { client } = supabaseStub({ user: null as never })
    mockCreateClient.mockResolvedValue(client)

    expect((await POST(jsonRequest(VALID_BODY))).status).toBe(401)
  })

  it("writes nothing for an anonymous caller", async () => {
    const { client, spies } = supabaseStub({ user: null as never })
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest(VALID_BODY))

    expect(spies.insert).not.toHaveBeenCalled()
    expect(spies.update).not.toHaveBeenCalled()
  })
})

describe("POST /api/kyc/submit validation", () => {
  beforeEach(() => {
    mockCreateClient.mockResolvedValue(supabaseStub().client)
  })

  it("returns 400 for a body with no name", async () => {
    expect((await POST(jsonRequest({ id_number: "123" }))).status).toBe(400)
  })

  it("returns 400 for a non-object body", async () => {
    expect((await POST(jsonRequest("approve me"))).status).toBe(400)
  })

  it("writes nothing when the body is rejected", async () => {
    const { client, spies } = supabaseStub()
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest({}))

    expect(spies.insert).not.toHaveBeenCalled()
    expect(spies.update).not.toHaveBeenCalled()
  })
})

describe("POST /api/kyc/submit first submission", () => {
  it("inserts a pending record owned by the session user", async () => {
    const { client, spies } = supabaseStub({ existing: null })
    mockCreateClient.mockResolvedValue(client)

    const res = await POST(jsonRequest(VALID_BODY))

    expect(res.status).toBe(200)
    expect(spies.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "u1", kyc_status: "pending", full_name: "Amina Juma" }))
  })

  it("ignores a user_id supplied by the caller", async () => {
    const { client, spies } = supabaseStub({ existing: null })
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest({ ...VALID_BODY, user_id: "victim-user-id" }))

    expect(spies.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "u1" }))
  })

  it("ignores a kyc_status supplied by the caller", async () => {
    const { client, spies } = supabaseStub({ existing: null })
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest({ ...VALID_BODY, kyc_status: "approved" }))

    expect(spies.insert).toHaveBeenCalledWith(expect.objectContaining({ kyc_status: "pending" }))
  })
})

describe("POST /api/kyc/submit resubmission", () => {
  it("updates the existing record and resets it to pending", async () => {
    const { client, spies } = supabaseStub({ existing: { id: "kyc-1" } })
    mockCreateClient.mockResolvedValue(client)

    const res = await POST(jsonRequest(VALID_BODY))

    expect(res.status).toBe(200)
    expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({ kyc_status: "pending", kyc_notes: null }))
    expect(spies.updateEq).toHaveBeenCalledWith("user_id", "u1")
  })

  it("cannot be made to reassign the record to another user", async () => {
    const { client, spies } = supabaseStub({ existing: { id: "kyc-1" } })
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest({ ...VALID_BODY, user_id: "victim-user-id" }))

    expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({ user_id: "u1" }))
  })

  it("cannot be made to self-approve on resubmission", async () => {
    const { client, spies } = supabaseStub({ existing: { id: "kyc-1" } })
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest({ ...VALID_BODY, kyc_status: "approved", kyc_notes: "looks fine" }))

    expect(spies.update).toHaveBeenCalledWith(expect.objectContaining({ kyc_status: "pending", kyc_notes: null }))
  })

  it("writes only the fields the form owns", async () => {
    const { client, spies } = supabaseStub({ existing: { id: "kyc-1" } })
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest({ ...VALID_BODY, is_admin: true, verified_by: "nobody" }))

    expect(spies.update).toHaveBeenCalledWith(expect.not.objectContaining({ is_admin: expect.anything() }))
    expect(spies.update).toHaveBeenCalledWith(expect.not.objectContaining({ verified_by: expect.anything() }))
  })
})

describe("POST /api/kyc/submit failures", () => {
  it("returns 500 and no database detail when the write fails", async () => {
    const { client } = supabaseStub({ existing: null, writeError: { message: "duplicate key value violates unique constraint" } })
    mockCreateClient.mockResolvedValue(client)

    const res = await POST(jsonRequest(VALID_BODY))

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({ error: "Failed to submit KYC" })
  })
})
