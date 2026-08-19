import { createAgentSchema, agentResponseSchema } from "@/lib/schemas/agent"

describe("Agent Zod Schemas (lib/schemas/agent.ts)", () => {
  describe("createAgentSchema", () => {
    it("validates correct agent payload", () => {
      const validData = {
        email: "john@tolatola.co",
        full_name: "John Mwakasege",
        phone: "+255712345678",
        role_name: "Sales Agent",
        region: "Dar es Salaam",
      }

      const result = createAgentSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe("john@tolatola.co")
      }
    })

    it("fails on invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        full_name: "John",
        phone: "12345678",
      }

      const result = createAgentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("fails on short full_name", () => {
      const invalidData = {
        email: "john@tolatola.co",
        full_name: "J",
        phone: "12345678",
      }

      const result = createAgentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("provides default role_name if omitted", () => {
      const dataWithoutRole = {
        email: "jane@tolatola.co",
        full_name: "Jane Doe",
        phone: "0712345678",
      }

      const result = createAgentSchema.parse(dataWithoutRole)
      expect(result.role_name).toBe("Sales Agent")
    })
  })

  describe("agentResponseSchema", () => {
    it("parses valid agent API response", () => {
      const apiResponse = {
        id: "agent-123",
        agent_code: "TOLA-001",
        status: "active",
        total_registrations: 15,
        total_commission: 45000,
        region: "Arusha",
        users: {
          full_name: "John Doe",
          email: "john@example.com",
        },
      }

      const result = agentResponseSchema.safeParse(apiResponse)
      expect(result.success).toBe(true)
    })

    it("rejects invalid status enum", () => {
      const invalidResponse = {
        id: "agent-123",
        agent_code: "TOLA-001",
        status: "unknown_status",
      }

      const result = agentResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })
})
