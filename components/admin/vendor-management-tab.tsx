"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, Search, Store, Mail, Phone, MapPin, Building2, Calendar, User, Eye } from "lucide-react"
import { clientApiGet, clientApiPost } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"

interface Vendor {
  id: string
  business_name: string
  tin_number: string
  nida_number: string
  address: string
  district: string
  region: string
  ward: string
  kyc_status: string
  is_active?: boolean | null
  business_license_url?: string
  created_at: string
  updated_at: string
  users?: {
    email: string
    full_name: string
    phone?: string
    vendor_type?: string
  }
  shops?: Array<{
    id: string
    name: string
  }>
}

const vendorTypeLabels: Record<string, string> = {
  producer: "Producer",
  manufacturer: "Manufacturer",
  supplier: "Supplier",
  wholesaler: "Wholesaler",
  retail_trader: "Retail Trader",
}

export function VendorManagementTab() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState("")
  const [viewDocumentDialog, setViewDocumentDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchVendors()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVendors(vendors)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredVendors(
        vendors.filter(
          (v) =>
            v.business_name?.toLowerCase().includes(query) ||
            v.users?.email?.toLowerCase().includes(query) ||
            v.users?.full_name?.toLowerCase().includes(query) ||
            v.tin_number?.toLowerCase().includes(query) ||
            v.nida_number?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, vendors])

  const fetchVendors = async () => {
    try {
      setIsLoading(true)
      const response = await clientApiGet<{ data: Vendor[] }>("admin/vendors")
      setVendors(response.data || [])
      setFilteredVendors(response.data || [])
    } catch (error) {
      console.error("Error fetching vendors:", error)
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (vendor: Vendor) => {
    try {
      const currentStatus = vendor.is_active ?? true
      const newStatus = !currentStatus
      await clientApiPost(`admin/vendors/${vendor.id}/${newStatus ? "activate" : "deactivate"}`)
      
      toast({
        title: newStatus ? "Vendor Activated" : "Vendor Deactivated",
        description: `${vendor.business_name} has been ${newStatus ? "activated" : "deactivated"}`,
      })
      
      // Update local state
      setVendors(vendors.map((v) => (v.id === vendor.id ? { ...v, is_active: newStatus } : v)))
      setFilteredVendors(filteredVendors.map((v) => (v.id === vendor.id ? { ...v, is_active: newStatus } : v)))
      if (selectedVendor?.id === vendor.id) {
        setSelectedVendor({ ...selectedVendor, is_active: newStatus })
      }
    } catch (error) {
      console.error("Error toggling vendor status:", error)
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive",
      })
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vendor Management</h2>
          <p className="text-muted-foreground">View and manage all vendor accounts</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {vendors.length} Total Vendors
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search vendors by name, email, TIN, or NIDA..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vendors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {vendors.filter((v) => v.is_active ?? true).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {vendors.filter((v) => !(v.is_active ?? true)).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved KYC</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {vendors.filter((v) => v.kyc_status === "approved").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "No vendors found matching your search" : "No vendors found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-primary" />
                      {vendor.business_name}
                    </CardTitle>
                    <CardDescription className="mt-1">{vendor.users?.email}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={(vendor.is_active ?? true) ? "default" : "secondary"}
                      className={(vendor.is_active ?? true) ? "bg-green-600" : "bg-gray-500"}
                    >
                      {(vendor.is_active ?? true) ? "Active" : "Inactive"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        vendor.kyc_status === "approved"
                          ? "border-green-500 text-green-700"
                          : vendor.kyc_status === "pending"
                            ? "border-yellow-500 text-yellow-700"
                            : "border-red-500 text-red-700"
                      }
                    >
                      {vendor.kyc_status || "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{vendor.users?.full_name || "N/A"}</span>
                  </div>
                  {vendor.users?.vendor_type && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{vendorTypeLabels[vendor.users.vendor_type] || vendor.users.vendor_type}</span>
                    </div>
                  )}
                  {vendor.users?.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{vendor.users.phone}</span>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{vendor.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(vendor.created_at).toLocaleDateString()}</span>
                  </div>
                  {vendor.shops && vendor.shops.length > 0 && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">{vendor.shops.length}</span> shop{vendor.shops.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(vendor)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className={`flex-1 ${(vendor.is_active ?? true) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                    onClick={() => handleToggleActive(vendor)}
                  >
                    {(vendor.is_active ?? true) ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vendor Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>Complete information for {selectedVendor?.business_name}</DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Business Name</Label>
                  <p className="font-medium">{selectedVendor.business_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedVendor.users?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedVendor.users?.full_name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedVendor.users?.phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vendor Type</Label>
                  <p className="font-medium">
                    {selectedVendor.users?.vendor_type
                      ? vendorTypeLabels[selectedVendor.users.vendor_type] || selectedVendor.users.vendor_type
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">TIN Number</Label>
                  <p className="font-medium">{selectedVendor.tin_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">NIDA Number</Label>
                  <p className="font-medium">{selectedVendor.nida_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">KYC Status</Label>
                  <Badge
                    className={
                      selectedVendor.kyc_status === "approved"
                        ? "bg-green-600"
                        : selectedVendor.kyc_status === "pending"
                          ? "bg-yellow-500"
                          : "bg-red-600"
                    }
                  >
                    {selectedVendor.kyc_status || "Pending"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Status</Label>
                  <Badge className={(selectedVendor.is_active ?? true) ? "bg-green-600" : "bg-gray-500"}>
                    {(selectedVendor.is_active ?? true) ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{selectedVendor.address || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">District</Label>
                  <p className="font-medium">{selectedVendor.district || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Region</Label>
                  <p className="font-medium">{selectedVendor.region || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ward</Label>
                  <p className="font-medium">{selectedVendor.ward || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{new Date(selectedVendor.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="font-medium">{new Date(selectedVendor.updated_at).toLocaleString()}</p>
                </div>
                {selectedVendor.shops && selectedVendor.shops.length > 0 && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Shops</Label>
                    <div className="mt-2 space-y-1">
                      {selectedVendor.shops.map((shop) => (
                        <Badge key={shop.id} variant="outline" className="mr-2">
                          {shop.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedVendor.business_license_url && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Business License</Label>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(selectedVendor.business_license_url!)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedVendor && (
              <Button
                className={(selectedVendor.is_active ?? true) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                onClick={() => {
                  handleToggleActive(selectedVendor)
                  setViewDialogOpen(false)
                }}
              >
                {(selectedVendor.is_active ?? true) ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Deactivate Account
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Activate Account
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={viewDocumentDialog} onOpenChange={setViewDocumentDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Business License Document</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[500px] bg-muted rounded-lg overflow-hidden">
            {documentUrl && (
              <Image src={documentUrl || "/placeholder.svg"} alt="Business License" fill className="object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

