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
  ChevronRight
} from "lucide-react"
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

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Profile Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">My Profile</h1>
          <div className="mt-3 flex items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm sm:text-base border-2 border-white shadow-sm">
              {profile?.full_name?.[0] || user.email?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 truncate text-sm sm:text-base">{profile?.full_name || "User"}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            {getKycStatusBadge()}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
          {/* Left Sidebar - Always visible */}
          <div className="w-full sm:w-64 md:w-72 flex-shrink-0">
            <div className="sm:sticky sm:top-24">
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-2 sm:p-4 space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 text-sm font-medium rounded-lg transition-all duration-200",
                        activeTab === item.id
                          ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", activeTab === item.id ? "text-indigo-600" : "text-zinc-400")} />
                      <span className="truncate">{item.label}</span>
                      {activeTab === item.id && <ChevronRight className="h-4 w-4 ml-auto text-indigo-400 hidden sm:block" />}
                    </button>
                  ))}
                </div>

                <div className="p-4 border-t border-zinc-100 hidden sm:block">
                  <p className="text-[10px] text-center text-zinc-400 uppercase tracking-wider">
                    Member since {new Date(user.created_at).getFullYear()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 sm:p-6 min-h-[400px]">
              <div className="mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-zinc-900">
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
