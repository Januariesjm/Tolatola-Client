"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  Headphones,
  ClipboardList,
  Store,
  Truck,
  ArrowRight,
  Clock,
  XCircle,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { clientApiPost } from "@/lib/api-client"

import PersonalInfoTab from "./personal-info-tab"
import KycVerificationTab from "./kyc-verification-tab"
import OrderHistoryTab from "./order-history-tab"
import TransactionHistoryTab from "./transaction-history-tab"
import AccountSettingsTab from "./account-settings-tab"
import SupportTab from "./support-tab"

interface ProfileContentProps {
  user: any
  profile: any
  kyc: any
  vendor?: any
  transporter?: any
  orders: any[]
  transactions: any[]
  tickets: any[]
  editableFields?: string[]
  readOnlyFields?: string[]
}

export default function ProfileContent({ user, profile, kyc, vendor, transporter, orders, transactions, tickets, editableFields, readOnlyFields }: ProfileContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("personal")
  const [switchingRole, setSwitchingRole] = useState<string | null>(null)

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
    { id: "support", label: "Support Tickets", icon: Headphones },
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

        {/* Market Validation Survey Banner */}
        <div className="mb-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 text-base sm:text-lg">Market Validation Survey</h3>
              <p className="text-sm text-zinc-600 mt-0.5">Help us build a better TOLA — share your feedback and trade insights.</p>
            </div>
          </div>
          <Link href="/validation">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-6 h-11 flex items-center gap-2 shadow-md shadow-emerald-600/15">
              Take Survey <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Your Business Roles */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-zinc-900 mb-1">Your Business Roles</h2>
          <p className="text-xs text-zinc-500 mb-3">Expand your account — sell products or deliver orders</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Seller Card */}
            {(() => {
              const vStatus = vendor?.kyc_status;
              const isApproved = vStatus === "approved";
              const isPending = vStatus === "pending";
              const isRejected = vStatus === "rejected";
              return (
                <div className={cn(
                  "rounded-2xl border-2 p-4 sm:p-5 transition-all",
                  isApproved ? "border-green-200 bg-green-50/50" : isPending ? "border-yellow-200 bg-yellow-50/50" : isRejected ? "border-red-200 bg-red-50/50" : "border-zinc-200 bg-white"
                )}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md",
                      isApproved ? "bg-green-600" : isPending ? "bg-yellow-500" : isRejected ? "bg-red-500" : "bg-indigo-600"
                    )}>
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-zinc-900 text-sm">Seller</p>
                      <p className="text-xs text-zinc-500">
                        {isApproved ? "Your seller account is active" : isPending ? "Application under review" : isRejected ? "Application was not approved" : "Sell your products on TOLA"}
                      </p>
                    </div>
                    {isApproved && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Active</Badge>
                    )}
                    {isPending && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
                    )}
                    {isRejected && (
                      <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>
                    )}
                  </div>
                  {isRejected && vendor?.kyc_notes && (
                    <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                      <span className="font-bold">Reason: </span>{vendor.kyc_notes}
                    </div>
                  )}
                  <Button
                    className={cn(
                      "w-full rounded-xl h-10 font-bold text-sm gap-2",
                      isApproved ? "bg-green-600 hover:bg-green-700" : isRejected ? "bg-red-600 hover:bg-red-700" : isPending ? "bg-zinc-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                    )}
                    disabled={isPending || switchingRole === "vendor"}
                    onClick={async () => {
                      if (isApproved) {
                        try {
                          setSwitchingRole("vendor");
                          await clientApiPost("profile/switch-role", { role: "vendor" });
                          router.push("/vendor/dashboard");
                        } catch { /* ignore */ } finally { setSwitchingRole(null); }
                      } else {
                        router.push("/vendor/register");
                      }
                    }}
                  >
                    {switchingRole === "vendor" ? "Switching..." : isApproved ? "Switch to Seller Dashboard" : isPending ? "Under Review" : isRejected ? "Reapply" : "Become a Seller"}
                    {!isPending && switchingRole !== "vendor" && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              );
            })()}

            {/* Transporter Card */}
            {(() => {
              const tStatus = transporter?.kyc_status;
              const isApproved = tStatus === "approved";
              const isPending = tStatus === "pending";
              const isRejected = tStatus === "rejected";
              return (
                <div className={cn(
                  "rounded-2xl border-2 p-4 sm:p-5 transition-all",
                  isApproved ? "border-green-200 bg-green-50/50" : isPending ? "border-yellow-200 bg-yellow-50/50" : isRejected ? "border-red-200 bg-red-50/50" : "border-zinc-200 bg-white"
                )}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md",
                      isApproved ? "bg-green-600" : isPending ? "bg-yellow-500" : isRejected ? "bg-red-500" : "bg-emerald-600"
                    )}>
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-zinc-900 text-sm">Transporter</p>
                      <p className="text-xs text-zinc-500">
                        {isApproved ? "Your transporter account is active" : isPending ? "Application under review" : isRejected ? "Application was not approved" : "Deliver orders across Tanzania"}
                      </p>
                    </div>
                    {isApproved && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Active</Badge>
                    )}
                    {isPending && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
                    )}
                    {isRejected && (
                      <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>
                    )}
                  </div>
                  {isRejected && transporter?.kyc_notes && (
                    <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                      <span className="font-bold">Reason: </span>{transporter.kyc_notes}
                    </div>
                  )}
                  <Button
                    className={cn(
                      "w-full rounded-xl h-10 font-bold text-sm gap-2",
                      isApproved ? "bg-green-600 hover:bg-green-700" : isRejected ? "bg-red-600 hover:bg-red-700" : isPending ? "bg-zinc-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                    )}
                    disabled={isPending || switchingRole === "transporter"}
                    onClick={async () => {
                      if (isApproved) {
                        try {
                          setSwitchingRole("transporter");
                          await clientApiPost("profile/switch-role", { role: "transporter" });
                          router.push("/transporter/dashboard");
                        } catch { /* ignore */ } finally { setSwitchingRole(null); }
                      } else {
                        router.push("/transporter/register");
                      }
                    }}
                  >
                    {switchingRole === "transporter" ? "Switching..." : isApproved ? "Switch to Transporter Dashboard" : isPending ? "Under Review" : isRejected ? "Reapply" : "Become a Transporter"}
                    {!isPending && switchingRole !== "transporter" && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              );
            })()}
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
                {activeTab === "personal" && <PersonalInfoTab profile={profile} kycStatus={kyc?.kyc_status} editableFields={editableFields} readOnlyFields={readOnlyFields} onProfileUpdated={() => router.refresh()} />}
                {activeTab === "kyc" && <KycVerificationTab kyc={kyc} userId={user.id} />}
                {activeTab === "orders" && <OrderHistoryTab orders={orders} />}
                {activeTab === "transactions" && <TransactionHistoryTab transactions={transactions} />}
                {activeTab === "support" && <SupportTab tickets={tickets} />}
                {activeTab === "settings" && <AccountSettingsTab user={user} profile={profile} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
