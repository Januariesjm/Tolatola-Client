"use client"

import {
  LayoutDashboard,
  Users,
  Percent,
  TrendingUp,
  Award,
  LogOut,
  User,
  Shield,
  MapPin,
  Menu,
  X
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface AgentSidebarProps {
  agent: any
  roleName: string
  activeTab: string
  setActiveTab: (tab: string) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

export function AgentSidebar({
  agent,
  roleName,
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
}: AgentSidebarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "registrations", label: "My Registrations", icon: Users },
    { id: "commissions", label: "Earnings & Commissions", icon: Percent },
    { id: "performance", label: "Performance Insights", icon: TrendingUp },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800/60 shadow-2xl">
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800/40">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-emerald-500/20 bg-white/5 backdrop-blur p-1">
            <Image
              src="/logo-new.png"
              alt="TolaTola"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-white uppercase flex flex-col">
            <span>Tola Sales</span>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
              {roleName}
            </span>
          </span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Agent Quick Profile info card */}
      <div className="px-6 py-5 border-b border-slate-800/40 bg-slate-950/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
            {agent.users?.full_name?.charAt(0) || "A"}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white truncate max-w-[140px]">
              {agent.users?.full_name || "Sales Officer"}
            </h4>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono uppercase tracking-wide">
              <Shield className="h-3 w-3 text-emerald-400" />
              {agent.agent_code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg">
          <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
          <span className="truncate">{agent.region || "Tanzania"}</span>
        </div>
      </div>

      {/* Main Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                setIsMobileOpen(false)
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
              }`} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout Footer Section */}
      <div className="p-4 border-t border-slate-800/40">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all text-sm font-medium"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 md:hidden"
        />
      )}

      {/* Mobile Drawer Container */}
      <div className={`fixed inset-y-0 left-0 w-64 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {sidebarContent}
      </div>
    </>
  )
}
