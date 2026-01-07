"use client"

import { clientApiPost } from "@/lib/api-client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Eye, Truck } from "lucide-react"
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

interface TransporterKYCApprovalTabProps {
  transporters: any[]
}

export function TransporterKYCApprovalTab({ transporters }: TransporterKYCApprovalTabProps) {
  const router = useRouter()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedTransporter, setSelectedTransporter] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewDocumentDialog, setViewDocumentDialog] = useState(false)
  const [documentUrl, setDocumentUrl] = useState("")
  const [documentTitle, setDocumentTitle] = useState("")

  const handleApprove = async (transporterId: string, userEmail: string, fullName: string) => {
    setIsSubmitting(true)

    try {
      await clientApiPost(`admin/transporters/${transporterId}/approve`)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error approving transporter:", error)
      alert("Failed to approve transporter. Please try again.")
    }

    setIsSubmitting(false)
  }

  const handleRejectClick = (transporter: any) => {
    setSelectedTransporter(transporter)
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
      await clientApiPost(`admin/transporters/${selectedTransporter.id}/reject`, {
        reason: rejectionReason
      })

      setRejectDialogOpen(false)
      setSelectedTransporter(null)
      setRejectionReason("")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error rejecting transporter:", error)
      alert("Failed to reject transporter. Please try again.")
    }
    setIsSubmitting(false)
  }

  const handleViewDocument = (url: string, title: string) => {
    setDocumentUrl(url)
    setDocumentTitle(title)
    setViewDocumentDialog(true)
  }

  const getVehicleTypeBadge = (vehicleType: string) => {
    const colors: Record<string, string> = {
      bodaboda: "bg-blue-500",
      bajaj: "bg-green-500",
      car: "bg-purple-500",
      canter: "bg-orange-500",
      semi_trailer: "bg-red-500",
      flight: "bg-indigo-500",
    }
    return colors[vehicleType] || "bg-gray-500"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transporter KYC Applications</h2>
        <Badge variant="outline">{transporters.length} Pending</Badge>
      </div>

      {transporters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No pending transporter KYC applications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {transporters.map((transporter) => (
            <Card key={transporter.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle>{transporter.users?.full_name || "Unnamed"}</CardTitle>
                      <CardDescription>{transporter.users?.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className="bg-yellow-500">Pending Review</Badge>
                    <Badge className={getVehicleTypeBadge(transporter.vehicle_type)}>
                      {transporter.vehicle_type?.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{transporter.users?.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle Registration:</span>
                    <span className="font-medium">{transporter.vehicle_registration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Number:</span>
                    <span className="font-medium">{transporter.license_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applied:</span>
                    <span className="font-medium">{new Date(transporter.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Document Links */}
                  <div className="pt-2 border-t space-y-2">
                    {transporter.license_document_url && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Driver's License:</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => handleViewDocument(transporter.license_document_url, "Driver's License")}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    )}
                    {transporter.vehicle_registration_document_url && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Vehicle Registration:</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() =>
                            handleViewDocument(transporter.vehicle_registration_document_url, "Vehicle Registration")
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    )}
                    {transporter.insurance_document_url && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Insurance:</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => handleViewDocument(transporter.insurance_document_url, "Insurance Document")}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() =>
                      handleApprove(transporter.id, transporter.users?.email, transporter.users?.full_name)
                    }
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                    onClick={() => handleRejectClick(transporter)}
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
            <DialogTitle>Reject Transporter Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedTransporter?.users?.full_name}'s application. An email will
              be sent with this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., License document is not clear, vehicle registration has expired, etc."
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{documentTitle}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[500px] bg-muted rounded-lg overflow-hidden">
            {documentUrl && (
              <Image src={documentUrl || "/placeholder.svg"} alt={documentTitle} fill className="object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
