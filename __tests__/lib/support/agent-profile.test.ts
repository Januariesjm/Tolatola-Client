/**
 * Tests for the support widget's AI persona constants
 * (lib/support/agent-profile.ts).
 *
 * The values themselves are display copy, but the extraction exists so five
 * inline copies of the avatar URL and eight of the name in
 * floating-support-widget.tsx cannot drift from each other. What is worth
 * pinning is the shape a consumer relies on -- non-empty strings, a real URL.
 */

import { SUPPORT_AGENT_AVATAR, SUPPORT_AGENT_NAME, SUPPORT_AGENT_ROLE } from "@/lib/support/agent-profile"

describe("agent-profile", () => {
  it("exports a non-empty display name", () => {
    expect(SUPPORT_AGENT_NAME.trim()).not.toBe("")
  })

  it("exports a non-empty role subtitle", () => {
    expect(SUPPORT_AGENT_ROLE.trim()).not.toBe("")
  })

  it("exports an https avatar URL, so it loads over a mixed-content-blocking browser", () => {
    expect(SUPPORT_AGENT_AVATAR).toMatch(/^https:\/\//)
  })

  it("keeps all three values as plain strings", () => {
    expect(typeof SUPPORT_AGENT_NAME).toBe("string")
    expect(typeof SUPPORT_AGENT_ROLE).toBe("string")
    expect(typeof SUPPORT_AGENT_AVATAR).toBe("string")
  })
})
