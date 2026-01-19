"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, AlertCircle, CheckCircle, Upload, Camera, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface KycVerificationTabProps {
  kyc: any
  userId: string
}

export default function KycVerificationTab({ kyc, userId }: KycVerificationTabProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: kyc?.full_name || "",
    date_of_birth: kyc?.date_of_birth || "",
    phone_number: kyc?.phone_number || "",
    address: kyc?.address || "",
    city: kyc?.city || "",
    region: kyc?.region || "",
    postal_code: kyc?.postal_code || "",
    id_type: kyc?.id_type || "nida",
    id_number: kyc?.id_number || "",
    id_document_front_url: kyc?.id_document_front_url || "",
    id_document_back_url: kyc?.id_document_back_url || "",
    selfie_url: kyc?.selfie_url || "",
  })

  const handleFileUpload = async (file: File, documentType: string) => {
    setUploadingDoc(documentType)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("documentType", documentType)

      const response = await fetch("/api/kyc/upload-document", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()

      // Update form data with the uploaded file URL
      setFormData((prev) => ({
        ...prev,
        [`${documentType}_url`]: data.url,
      }))
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Failed to upload file. Please try again.")
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, user_id: userId }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Error submitting KYC:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusAlert = () => {
    if (!kyc) {
      return (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-indigo-900 dark:text-indigo-300">Verification Required</h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-400/80 mt-1">
              Complete your KYC verification to unlock full Digital trade and Supply Chain Ecosystem features and build trust with vendors.
            </p>
          </div>
        </div>
      )
    }

    switch (kyc.kyc_status) {
      case "approved":
        return (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-4 flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 dark:text-green-300">Verified Account</h4>
              <p className="text-sm text-green-700 dark:text-green-400/80 mt-1">
                Your identity has been verified. You can now enjoy full Digital trade and Supply Chain Ecosystem access.
              </p>
            </div>
          </div>
        )
      case "pending":
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-xl p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 dark:text-yellow-300">Under Review</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400/80 mt-1">
                Your KYC application is under review. We'll notify you once it's processed.
              </p>
            </div>
          </div>
        )
      case "rejected":
        return (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-300">Verification Failed</h4>
              <p className="text-sm text-red-700 dark:text-red-400/80 mt-1">
                Your KYC application was rejected. {kyc.kyc_notes && `Reason: ${kyc.kyc_notes}`}
              </p>
            </div>
          </div>
        )
      case "changes_requested":
        return (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900 dark:text-orange-300">Changes Requested</h4>
              <p className="text-sm text-orange-700 dark:text-orange-400/80 mt-1">
                {kyc.kyc_notes}. Please update your information and resubmit.
              </p>
            </div>
          </div>
        )
    }
  }

  const canEdit = !kyc || kyc.kyc_status === "rejected" || kyc.kyc_status === "changes_requested"

  const DocumentUpload = ({
    label,
    documentType,
    currentUrl,
    required = false,
    description,
  }: {
    label: string
    documentType: string
    currentUrl: string
    required?: boolean
    description: string
  }) => (
    <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg p-4 border border-zinc-100 dark:border-zinc-800/50">
      <div className="flex items-center justify-between">
        <Label htmlFor={documentType} className="text-base font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      </div>

      <p className="text-xs text-muted-foreground">{description}</p>

      {currentUrl && (
        <div className="relative group">
          <div className="h-48 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <img
              src={currentUrl || "/placeholder.svg"}
              alt={label}
              className="w-full h-full object-cover"
            />
          </div>
          {canEdit && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setFormData({ ...formData, [`${documentType}_url`]: "" })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {canEdit && !currentUrl && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"
              disabled={uploadingDoc === documentType}
              onClick={() => document.getElementById(`${documentType}-file`)?.click()}
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs">Upload File</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"
              disabled={uploadingDoc === documentType}
              onClick={() => document.getElementById(`${documentType}-camera`)?.click()}
            >
              <Camera className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs">Take Photo</span>
            </Button>
          </div>

          <input
            id={`${documentType}-file`}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file, documentType)
            }}
          />

          <input
            id={`${documentType}-camera`}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file, documentType)
            }}
          />
          {uploadingDoc === documentType && <p className="text-center text-xs text-indigo-600 animate-pulse">Uploading...</p>}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {getStatusAlert()}

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Identity Details</h3>
          <p className="text-sm text-muted-foreground">Please provide your official identification details below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name (as per ID)</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!canEdit}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                disabled={!canEdit}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                disabled={!canEdit}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!canEdit}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                disabled={!canEdit}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code (Optional)</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                disabled={!canEdit}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Full Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!canEdit}
              required
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              Identification Documents
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="id_type">ID Type</Label>
                <Select
                  value={formData.id_type}
                  onValueChange={(value) => setFormData({ ...formData, id_type: value })}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nida">NIDA (National ID)</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="voters_id">Voter's ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number">ID Number</Label>
                <Input
                  id="id_number"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  disabled={!canEdit}
                  required
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <DocumentUpload
                label="ID Front"
                documentType="id_document_front"
                currentUrl={formData.id_document_front_url}
                required
                description="Clear photo of ID front"
              />

              <DocumentUpload
                label="ID Back"
                documentType="id_document_back"
                currentUrl={formData.id_document_back_url}
                description="Clear photo of ID back (if applicable)"
              />

              <DocumentUpload
                label="Selfie with ID"
                documentType="selfie"
                currentUrl={formData.selfie_url}
                required
                description="Your face and ID clearly visible"
              />
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading || uploadingDoc !== null} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px]">
                {isLoading ? "Submitting..." : kyc ? "Resubmit Application" : "Submit Application"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
