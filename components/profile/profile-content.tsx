"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, ShieldCheck, Package, CreditCard, Settings } from "lucide-react"
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
    if (!kyc) {
      return <Badge variant="secondary">Not Verified</Badge>
    }

    switch (kyc.kyc_status) {
      case "approved":
        return <Badge className="bg-green-600">Verified</Badge>
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "changes_requested":
        return <Badge variant="outline">Changes Requested</Badge>
      default:
        return <Badge variant="secondary">Not Verified</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Profile</h1>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
            <div className="flex items-center gap-2">{getKycStatusBadge()}</div>
          </div>
        </div>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Personal Info</span>
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">KYC</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalInfoTab profile={profile} kycStatus={kyc?.kyc_status} />
          </TabsContent>

          <TabsContent value="kyc">
            <KycVerificationTab kyc={kyc} userId={user.id} />
          </TabsContent>

          <TabsContent value="orders">
            <OrderHistoryTab orders={orders} />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistoryTab transactions={transactions} />
          </TabsContent>

          <TabsContent value="settings">
            <AccountSettingsTab user={user} profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
