"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  User,
  ShieldCheck,
  Package,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Menu
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import PersonalInfoTab from "./personal-info-tab"
import KycVerificationTab from "./kyc-verification-tab"
import OrderHistoryTab from "./order-history-tab"
import TransactionHistoryTab from "./transaction-history-tab"
import AccountSettingsTab from "./account-settings-tab"

interface ProfileContentProps {
  user: any
  profile: any
  kyc: any
  orders: any[]
  transactions: any[]
}

export default function ProfileContent({ user, profile, kyc, orders, transactions }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState("personal")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getKycStatusBadge = () => {
    if (!kyc) return <Badge variant="secondary">Not Verified</Badge>

    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className?: string, label: string }> = {
      approved: { variant: "default", className: "bg-green-600 hover:bg-green-700", label: "Verified" },
      pending: { variant: "secondary", className: "bg-yellow-500/15 text-yellow-700 border-yellow-200", label: "Pending Review" },
      rejected: { variant: "destructive", label: "Rejected" },
      changes_requested: { variant: "outline", className: "border-orange-200 text-orange-700 bg-orange-50", label: "Changes Requested" }
    }

    const status = variants[kyc.kyc_status] || variants.pending
    return <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
  }

  const navItems = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "kyc", label: "KYC Verification", icon: ShieldCheck },
    { id: "orders", label: "Order History", icon: Package },
    { id: "transactions", label: "Transactions", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg border-2 border-white dark:border-zinc-800 shadow-sm">
            {profile?.full_name?.[0] || user.email?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 truncate">{profile?.full_name || "User"}</h2>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <div className="mt-4">
          {getKycStatusBadge()}
        </div>
      </div>

      <div className="p-4 space-y-1 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id)
              setIsMobileMenuOpen(false)
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
              activeTab === item.id
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <item.icon className={cn("h-4 w-4", activeTab === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400")} />
            {item.label}
            {activeTab === item.id && <ChevronRight className="h-4 w-4 ml-auto text-indigo-400" />}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-xs text-center text-muted-foreground">
          Member since {new Date(user.created_at).getFullYear()}
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">My Profile</h1>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-0 bg-transparent shadow-none">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className="sticky top-24">
              <SidebarContent />
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 min-h-[400px]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {navItems.find(i => i.id === activeTab)?.label}
                </h2>
                <Separator className="mt-4" />
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "personal" && <PersonalInfoTab profile={profile} kycStatus={kyc?.kyc_status} />}
                {activeTab === "kyc" && <KycVerificationTab kyc={kyc} userId={user.id} />}
                {activeTab === "orders" && <OrderHistoryTab orders={orders} />}
                {activeTab === "transactions" && <TransactionHistoryTab transactions={transactions} />}
                {activeTab === "settings" && <AccountSettingsTab user={user} profile={profile} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
