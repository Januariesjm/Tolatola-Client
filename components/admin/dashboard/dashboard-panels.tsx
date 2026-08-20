"use client"

import { Network, ShieldAlert } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import type { AdminDashboardContentProps } from "@/lib/types/admin"

import { AnalyticsTab } from "../analytics-tab"
import { KYCApprovalTab } from "../kyc-approval-tab"
import { TransporterKYCApprovalTab } from "../transporter-kyc-approval-tab"
import { CustomerKYCApprovalTab } from "../customer-kyc-approval-tab"
import { ProductApprovalTab } from "../product-approval-tab"
import { ProductManagementTab } from "../product-management-tab"
import { OrdersManagementTab } from "../orders-management-tab"
import { SecureFundsManagementTab } from "../secure-funds-tab"
import { PayoutApprovalTab } from "../payout-approval-tab"
import { FinanceHubTab } from "../finance/finance-hub-tab"
import { SupportTicketsTab } from "../support-tickets-tab"
import { IncompleteRegistrationsTab } from "../incomplete-registrations-tab"
import { PromotionsManagementTab } from "../promotions-management-tab"
import { BlogManagementTab } from "../blog-management-tab"
import { VendorManagementTab } from "../vendor-management-tab"
import { TransporterManagementTab } from "../transporter-management-tab"
import { CustomerManagementTab } from "../customer-management-tab"
import { VendorSubscriptionsTab } from "../vendor-subscriptions-tab"
import { HRApplicationsTab } from "../hr-applications-tab"
import { InfrastructureTab } from "../infrastructure-tab"
import { SystemHealthTab } from "../system-health-tab"
import { ServerLogsTab } from "../server-logs-tab"
import { MessagingTab } from "../messaging-tab"
import { ValidationSurveysTab } from "../validation-surveys-tab"
import { AgentManagementTab } from "../agent-management-tab"
import { AdminUsersManagementTab } from "../admin-users-management-tab"

const PANEL_CLASS = "border-none p-0 outline-none"

interface DashboardPanelsProps extends AdminDashboardContentProps {
  /** Promotions with the meta-info entries already stripped out. */
  actualPromotions: AdminDashboardContentProps["promotions"]
  isSuperAdmin: boolean
  showAdminManagement: boolean
  canManageAgents: boolean
  /** Department used to scope the support queue; undefined for super admins. */
  userDepartment?: string
}

/** Placeholder panel for sections that are navigable but not yet built. */
function ComingSoonPanel({
  icon: Icon,
  bubble,
  iconColor,
  title,
  description,
}: {
  icon: typeof Network
  bubble: string
  iconColor: string
  title: string
  description: string
}) {
  return (
    <Card className="border-none shadow-none bg-slate-50/50">
      <CardContent className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className={`h-20 w-20 rounded-full ${bubble} flex items-center justify-center mb-6`}>
          <Icon className={`h-10 w-10 ${iconColor} opacity-80`} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500 max-w-md">{description}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Every admin tab panel. Panels whose child component fetches its own data are
 * permission-gated here so the fetch never runs for an admin who cannot see the
 * section.
 */
export function DashboardPanels({
  adminRole,
  stats,
  pendingVendors,
  pendingTransporters,
  pendingCustomerKyc,
  pendingProducts,
  allProducts = [],
  orders,
  transactions,
  payouts,
  tickets,
  subscriptions,
  vendorTypesAnalytics = {},
  careerApplications = [],
  hrInterviews = [],
  hrStaffRecords = [],
  hrContracts = [],
  hrAttendance = [],
  incompleteRegistrations = [],
  initialAgents = [],
  actualPromotions,
  isSuperAdmin,
  showAdminManagement,
  canManageAgents,
  userDepartment,
}: DashboardPanelsProps) {
  const can = (permission: string) => Boolean(adminRole?.permissions.includes(permission))

  return (
    <>
      <TabsContent value="analytics" className={PANEL_CLASS}>
        <AnalyticsTab
          stats={stats}
          vendorTypesAnalytics={vendorTypesAnalytics}
          orders={orders}
          payouts={payouts}
        />
      </TabsContent>

      <TabsContent value="kyc" className={PANEL_CLASS}>
        <KYCApprovalTab vendors={pendingVendors} />
      </TabsContent>

      <TabsContent value="transporter-kyc" className={PANEL_CLASS}>
        <TransporterKYCApprovalTab transporters={pendingTransporters} />
      </TabsContent>

      <TabsContent value="customer-kyc" className={PANEL_CLASS}>
        <CustomerKYCApprovalTab customers={pendingCustomerKyc} />
      </TabsContent>

      <TabsContent value="products" className={PANEL_CLASS}>
        <ProductApprovalTab products={pendingProducts} />
      </TabsContent>

      <TabsContent value="all-products" className={PANEL_CLASS}>
        <ProductManagementTab initialProducts={allProducts} />
      </TabsContent>

      <TabsContent value="orders" className={PANEL_CLASS}>
        <OrdersManagementTab orders={orders} />
      </TabsContent>

      <TabsContent value="transactions" className={PANEL_CLASS}>
        <SecureFundsManagementTab transactions={transactions} />
      </TabsContent>

      <TabsContent value="payouts" className={PANEL_CLASS}>
        <PayoutApprovalTab payouts={payouts} />
      </TabsContent>

      <TabsContent value="finance" className={PANEL_CLASS}>
        <FinanceHubTab orders={orders} transactions={transactions} payouts={payouts} stats={stats} />
      </TabsContent>

      <TabsContent value="support" className={PANEL_CLASS}>
        <SupportTicketsTab
          tickets={tickets}
          department={userDepartment}
          roleName={adminRole?.role?.role_name || "Administrator"}
          isSuperAdmin={isSuperAdmin}
        />
      </TabsContent>

      <TabsContent value="recovery" className={PANEL_CLASS}>
        <IncompleteRegistrationsTab registrations={incompleteRegistrations} />
      </TabsContent>

      <TabsContent value="promotions" className={PANEL_CLASS}>
        <PromotionsManagementTab promotions={actualPromotions} />
      </TabsContent>

      {can("manage_blog") && (
        <TabsContent value="blog" className={PANEL_CLASS}>
          <BlogManagementTab />
        </TabsContent>
      )}

      <TabsContent value="vendors" className={PANEL_CLASS}>
        <VendorManagementTab />
      </TabsContent>

      <TabsContent value="transporters" className={PANEL_CLASS}>
        <TransporterManagementTab />
      </TabsContent>

      <TabsContent value="customers" className={PANEL_CLASS}>
        <CustomerManagementTab />
      </TabsContent>

      <TabsContent value="subscriptions" className={PANEL_CLASS}>
        <VendorSubscriptionsTab subscriptions={subscriptions} />
      </TabsContent>

      <TabsContent value="hr" className={PANEL_CLASS}>
        <HRApplicationsTab
          applications={careerApplications}
          interviews={hrInterviews}
          staff={hrStaffRecords}
          contracts={hrContracts}
          attendance={hrAttendance}
        />
      </TabsContent>

      {can("manage_system") && (
        <>
          <TabsContent value="infrastructure" className={PANEL_CLASS}>
            <InfrastructureTab />
          </TabsContent>

          <TabsContent value="api-integrations" className={PANEL_CLASS}>
            <ComingSoonPanel
              icon={Network}
              bubble="bg-indigo-100"
              iconColor="text-indigo-600"
              title="API & Integrations"
              description="Manage 3rd-party services, webhooks, and API keys here."
            />
          </TabsContent>

          <TabsContent value="security-access" className={PANEL_CLASS}>
            <ComingSoonPanel
              icon={ShieldAlert}
              bubble="bg-rose-100"
              iconColor="text-rose-600"
              title="Security & Access"
              description="Monitor security systems and user access controls here."
            />
          </TabsContent>

          <TabsContent value="system-health" className={PANEL_CLASS}>
            <SystemHealthTab />
          </TabsContent>
        </>
      )}

      {can("view_logs") && (
        <TabsContent value="logs" className={PANEL_CLASS}>
          <ServerLogsTab />
        </TabsContent>
      )}

      {(can("manage_vendors") || can("manage_customers") || can("manage_transporters")) && (
        <TabsContent value="messaging" className={PANEL_CLASS}>
          <MessagingTab />
        </TabsContent>
      )}

      {can("view_analytics") && (
        <TabsContent value="validation" className={PANEL_CLASS}>
          <ValidationSurveysTab />
        </TabsContent>
      )}

      {canManageAgents && (
        <TabsContent value="agents" className={PANEL_CLASS}>
          <AgentManagementTab initialAgents={initialAgents} />
        </TabsContent>
      )}

      {showAdminManagement && (
        <TabsContent value="admins" className={PANEL_CLASS}>
          <AdminUsersManagementTab />
        </TabsContent>
      )}
    </>
  )
}
