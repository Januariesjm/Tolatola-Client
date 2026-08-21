/**
 * Tests for components/ui/sidebar/ (Sidebar, SidebarProvider, SidebarMenu*, useSidebar).
 *
 * This shadcn primitive is split across sidebar-provider.tsx, sidebar.tsx and
 * sidebar-menu.tsx (re-exported from index.tsx) purely to stay under the
 * repo's file-size guideline -- no behavior changed. What's worth pinning:
 * the pieces still compose (menu items render inside a provider), and
 * useSidebar still enforces that it needs one, since that invariant is easy
 * to lose across a file split.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

describe("Sidebar composition", () => {
  it("renders menu items inside a provider", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Dashboard</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>,
    )

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /toggle sidebar/i })).toBeInTheDocument()
  })
})

describe("useSidebar", () => {
  it("throws when used outside a SidebarProvider", () => {
    const Consumer = () => {
      useSidebar()
      return null
    }
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<Consumer />)).toThrow("useSidebar must be used within a SidebarProvider.")

    consoleError.mockRestore()
  })
})
