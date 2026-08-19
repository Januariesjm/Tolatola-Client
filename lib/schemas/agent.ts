import { z } from "zod"

export const createAgentSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(7, "Phone number must be at least 7 digits"),
  role_name: z.string().default("Sales Agent"),
  region: z.string().optional(),
  district: z.string().optional(),
  area: z.string().optional(),
})

export type CreateAgentInput = z.infer<typeof createAgentSchema>

export const agentResponseSchema = z.object({
  id: z.string(),
  agent_code: z.string(),
  status: z.enum(["active", "suspended", "pending"]),
  total_registrations: z.number().default(0),
  total_commission: z.number().default(0),
  region: z.string().nullable().optional(),
  users: z
    .object({
      full_name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
    })
    .optional(),
})

export type AgentResponse = z.infer<typeof agentResponseSchema>
