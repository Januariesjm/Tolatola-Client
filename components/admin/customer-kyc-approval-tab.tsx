"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Eye, User } from "lucide-react"
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
import { ExternalLink, FileText } from "lucide-react"
import { clientApiPost } from "@/lib/api-client"

interface CustomerKYCApprovalTabProps {
    customers: any[]
}

export function CustomerKYCApprovalTab({ customers }: CustomerKYCApprovalTabProps) {
    const router = useRouter()
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [viewDocumentDialog, setViewDocumentDialog] = useState(false)
    const [documentUrl, setDocumentUrl] = useState("")

    const handleApprove = async (kycId: string) => {
        setIsSubmitting(true)

        try {
            await clientApiPost(`admin/customers-kyc/${kycId}/approve`)
            router.refresh()
        } catch (error) {
            console.error("Error approving customer KYC:", error)
            alert("Failed to approve KYC. Please try again.")
        }

        setIsSubmitting(false)
    }

    const handleRejectClick = (kyc: any) => {
        setSelectedCustomer(kyc)
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
            await clientApiPost(`admin/customers-kyc/${selectedCustomer.id}/reject`, {
                reason: rejectionReason
            })

            setRejectDialogOpen(false)
            setSelectedCustomer(null)
            setRejectionReason("")
            router.refresh()
        } catch (error) {
            console.error("Error rejecting customer KYC:", error)
            alert("Failed to reject KYC. Please try again.")
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
                <h2 className="text-2xl font-bold">Customer KYC Applications</h2>
                <Badge variant="outline">{customers.length} Pending</Badge>
            </div>

            {customers.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No pending customer KYC applications</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {customers.map((kyc) => (
                        <Card key={kyc.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        <div>
                                            <CardTitle>{kyc.users?.full_name || "Unnamed User"}</CardTitle>
                                            <CardDescription>{kyc.users?.email}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge className="bg-yellow-500">Pending Review</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Phone:</span>
                                        <span className="font-medium">{kyc.users?.phone || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ID Type:</span>
                                        <span className="font-medium">{kyc.id_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ID Number:</span>
                                        <span className="font-medium">{kyc.id_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Applied:</span>
                                        <span className="font-medium">{new Date(kyc.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {kyc.id_document_url && (
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <span className="text-muted-foreground">ID Document:</span>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0"
                                                onClick={() => handleViewDocument(kyc.id_document_url)}
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
                                        onClick={() => handleApprove(kyc.id)}
                                        disabled={isSubmitting}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                                        onClick={() => handleRejectClick(kyc)}
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
                        <DialogTitle>Reject Customer KYC</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting {selectedCustomer?.users?.full_name}'s KYC application.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejection-reason">Rejection Reason</Label>
                            <Textarea
                                id="rejection-reason"
                                placeholder="e.g., ID document is blurred, ID number mismatch, etc."
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
                            <DialogTitle>ID Document Preview</DialogTitle>
                            <DialogDescription>
                                Full size preview of the uploaded identity document
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
