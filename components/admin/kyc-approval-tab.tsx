"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { ExternalLink, FileText, Download } from "lucide-react"

import { clientApiPost } from "@/lib/api-client"

interface KYCApprovalTabProps {
  vendors: any[]
}

export function KYCApprovalTab({ vendors }: KYCApprovalTabProps) {
  const router = useRouter()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewDocumentDialog, setViewDocumentDialog] = useState(false)
  const [documentUrl, setDocumentUrl] = useState("")

  const handleApprove = async (vendorId: string) => {
    setIsSubmitting(true)

    try {
      await clientApiPost(`admin/vendors/${vendorId}/activate`)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error approving vendor:", error)
      alert("Failed to approve vendor. Please try again.")
    }

    setIsSubmitting(false)
  }

  const handleRejectClick = (vendor: any) => {
    setSelectedVendor(vendor)
    setRejectionReason("")
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }

    setIsSubmitting(true)

    try {
      await clientApiPost(`admin/vendors/${selectedVendor.id}/reject`, {
        reason: rejectionReason
      })

      setRejectDialogOpen(false)
      setSelectedVendor(null)
      setRejectionReason("")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error rejecting vendor:", error)
      alert("Failed to reject vendor. Please try again.")
    }

    setIsSubmitting(false)
  }

  const handleViewDocument = (url: string) => {
    setDocumentUrl(url)
    setViewDocumentDialog(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vendor KYC Applications</h2>
        <Badge variant="outline">{(vendors || []).length} Pending</Badge>
      </div>

      {(!vendors || vendors.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No pending KYC applications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{vendor.business_name}</CardTitle>
                    <CardDescription>{vendor.users?.email}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className="bg-yellow-500">Pending Review</Badge>
                    {vendor.kyc_type && (
                      <Badge variant="outline" className="text-xs">
                        {vendor.kyc_type === "individual" ? "Individual / Sole Trader" : "Company"}
                      </Badge>
                    )}
                    {vendor.users?.vendor_type && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {vendor.users.vendor_type.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-medium">{vendor.users?.full_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{vendor.users?.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{vendor.phone_number || vendor.users?.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{vendor.location || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TIN Number:</span>
                    <span className="font-medium">{vendor.tin_number}</span>
                  </div>

                  {/* Company Representative Details */}
                  {vendor.kyc_type === "company" && (
                    <>
                      <div className="pt-3 border-t">
                        <p className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">
                          Company Representative
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rep. Name:</span>
                        <span className="font-medium">{vendor.representative_full_name || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rep. Phone:</span>
                        <span className="font-medium">{vendor.representative_phone || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rep. TIN:</span>
                        <span className="font-medium">{vendor.representative_tin || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rep. Position:</span>
                        <span className="font-medium">{vendor.representative_position || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rep. National ID:</span>
                        <span className="font-medium">{vendor.representative_national_id || "N/A"}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Applied:</span>
                    <span className="font-medium">{new Date(vendor.created_at).toLocaleDateString()}</span>
                  </div>
                  {vendor.business_license_url && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-muted-foreground">Business License:</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => handleViewDocument(vendor.business_license_url)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Document
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(vendor.id)}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                    onClick={() => handleRejectClick(vendor)}
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedVendor?.business_name}'s application. This will be shown to
              the vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Business license is not clear, TIN number is invalid, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={viewDocumentDialog} onOpenChange={setViewDocumentDialog}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-4">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <DialogTitle>Business License Document</DialogTitle>
              <DialogDescription>
                Full size preview of the uploaded document
              </DialogDescription>
            </div>
            <div className="flex gap-2 mr-6">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => window.open(documentUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Original
              </Button>
            </div>
          </DialogHeader>
          <div className="relative flex-1 bg-stone-100 rounded-xl overflow-hidden border border-stone-200">
            {documentUrl ? (
              documentUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`${documentUrl}#toolbar=0`}
                  className="w-full h-full border-none"
                  title="PDF Document Viewer"
                />
              ) : (
                <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                  <img
                    src={documentUrl}
                    alt="Document"
                    className="max-w-full h-auto shadow-2xl rounded-sm"
                  />
                </div>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <FileText className="h-12 w-12 opacity-20" />
                <p>No document selected</p>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button variant="secondary" onClick={() => setViewDocumentDialog(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
