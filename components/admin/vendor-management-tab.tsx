"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  CheckCircle2,
  XCircle,
  Search,
  Store,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  User,
  Eye,
  Trash2,
  MessageSquare,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { AdminMessageDialog } from "@/components/admin/message-dialog"
import { VendorDetailsDialog } from "@/components/admin/vendor-details-dialog"
import { useAdminVendors } from "@/hooks/use-admin-vendors"
import { vendorTypeLabel, type Vendor } from "@/lib/admin/vendors"

export function VendorManagementTab() {
  const { vendors, filteredVendors, searchQuery, setSearchQuery, isLoading, toggleActive, deleteVendor } = useAdminVendors()
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState("")
  const [messageVendor, setMessageVendor] = useState<Vendor | null>(null)
  const [viewDocumentDialog, setViewDocumentDialog] = useState(false)

  const handleToggleActive = async (vendor: Vendor) => {
    await toggleActive(vendor)
    // Keep the open dialog in step with the row it was opened from.
    if (selectedVendor?.id === vendor.id) {
      setSelectedVendor({ ...selectedVendor, is_active: !(vendor.is_active ?? true) })
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    if (await deleteVendor(vendorId)) setViewDialogOpen(false)
  }

  const handleViewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setViewDialogOpen(true)
  }

  const handleViewDocument = (url: string) => {
    setDocumentUrl(url)
    setViewDocumentDialog(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">View and manage all vendor accounts</p>
        </div>
        <Badge variant="outline" className="text-sm px-4 py-2 border-slate-200 bg-white font-semibold tabular-nums self-start sm:self-auto">
          {vendors.length} Total Vendors
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search vendors by name, email, TIN, or NIDA..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-primary/30 placeholder:text-slate-400"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-slate-400 to-slate-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Total Vendors</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{vendors.length}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Active</p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{vendors.filter((v) => v.is_active ?? true).length}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-red-100 bg-white p-4 shadow-sm">
          <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-red-400 to-red-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Inactive</p>
          <p className="text-2xl font-bold text-red-600 tabular-nums">{vendors.filter((v) => !(v.is_active ?? true)).length}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-blue-400 to-blue-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">KYC Approved</p>
          <p className="text-2xl font-bold text-blue-600 tabular-nums">{vendors.filter((v) => v.kyc_status === "approved").length}</p>
        </div>
      </div>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Store className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500">
              {searchQuery ? "No vendors found matching your search" : "No vendors found"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery ? "Try adjusting your search terms" : "Vendors will appear here once registered"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredVendors.map((vendor, idx) => {
            const isActive = vendor.is_active ?? true
            const kycColor = vendor.kyc_status === "approved" ? "emerald" : vendor.kyc_status === "pending" ? "amber" : "red"

            return (
              <div
                key={vendor.id}
                className={`group relative rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
                  isActive ? "border-slate-200" : "border-slate-200 opacity-75"
                }`}
              >
                {/* Top accent bar */}
                <div
                  className={`h-1 w-full ${
                    vendor.kyc_status === "approved"
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : vendor.kyc_status === "pending"
                        ? "bg-gradient-to-r from-amber-400 to-amber-500"
                        : "bg-gradient-to-r from-red-400 to-red-500"
                  }`}
                />

                {/* Card Header */}
                <div className="px-5 pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                        vendor.kyc_status === "approved"
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                          : vendor.kyc_status === "pending"
                            ? "bg-gradient-to-br from-amber-500 to-amber-600"
                            : "bg-gradient-to-br from-red-500 to-red-600"
                      }`}
                    >
                      {vendor.business_name?.charAt(0)?.toUpperCase() || "V"}
                    </div>

                    {/* Name & email */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                          #{idx + 1}
                        </span>
                        <h3 className="font-semibold text-slate-900 truncate text-sm leading-tight">{vendor.business_name}</h3>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{vendor.users?.email}</p>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-col gap-1 shrink-0 items-end">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {isActive ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          vendor.kyc_status === "approved"
                            ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                            : vendor.kyc_status === "pending"
                              ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                              : "bg-red-50 text-red-600 ring-1 ring-red-200"
                        }`}
                      >
                        {vendor.kyc_status || "pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-5 border-t border-slate-100" />

                {/* Details */}
                <div className="px-5 py-3 space-y-2">
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{vendor.users?.full_name || "N/A"}</span>
                  </div>
                  {vendor.users?.vendor_type && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{vendorTypeLabel(vendor.users.vendor_type)}</span>
                    </div>
                  )}
                  {(vendor.users?.phone || vendor.phone) && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{vendor.users?.phone || vendor.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Joined {new Date(vendor.created_at).toLocaleDateString()}</span>
                  </div>
                  {vendor.shops && vendor.shops.length > 0 && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      <Store className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        <span className="font-semibold text-slate-700">{vendor.shops.length}</span> shop
                        {vendor.shops.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-5 pb-4 pt-2 space-y-2">
                  <div className="border-t border-slate-100 pt-3" />
                  {/* Row 1: View Details + Message */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs rounded-lg border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                      onClick={() => handleViewDetails(vendor)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs rounded-lg border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                      onClick={() => setMessageVendor(vendor)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Message
                    </Button>
                  </div>
                  {/* Row 2: Toggle Active + Delete */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className={`flex-1 h-8 text-xs rounded-lg font-medium transition-colors ${
                        isActive ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"
                      }`}
                      onClick={() => handleToggleActive(vendor)}
                    >
                      {isActive ? (
                        <>
                          <XCircle className="h-3.5 w-3.5 mr-1.5" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors shrink-0"
                      onClick={() => {
                        if (
                          confirm(
                            `Are you absolutely sure you want to permanently delete "${vendor.business_name}"? This action cannot be undone and will delete all their products, shops, payouts, and user accounts.`,
                          )
                        ) {
                          handleDeleteVendor(vendor.id)
                        }
                      }}
                      title="Delete vendor permanently"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Vendor Details Dialog */}
      <VendorDetailsDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        vendor={selectedVendor}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteVendor}
        onViewDocument={handleViewDocument}
        onMessage={setMessageVendor}
      />

      {/* Document Viewer Dialog */}
      <Dialog open={viewDocumentDialog} onOpenChange={setViewDocumentDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Business License Document</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[500px] bg-muted rounded-lg overflow-hidden">
            {documentUrl && <Image src={documentUrl || "/placeholder.svg"} alt="Business License" fill className="object-contain" />}
          </div>
        </DialogContent>
      </Dialog>
      {/* Admin Message Dialog */}
      {messageVendor && (
        <AdminMessageDialog
          isOpen={!!messageVendor}
          onClose={() => setMessageVendor(null)}
          recipientId={messageVendor.user_id || messageVendor.id}
          recipientName={messageVendor.users?.full_name || messageVendor.business_name}
        />
      )}
    </div>
  )
}
