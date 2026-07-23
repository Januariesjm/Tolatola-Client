"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, Search, Mail, Phone, Calendar, User, Eye, Truck, ShieldCheck, Trash2, MessageSquare } from "lucide-react"
import { clientApiGet, clientApiPost, clientApiDelete } from "@/lib/api-client"
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
import { AdminMessageDialog } from "@/components/admin/message-dialog"

interface Transporter {
    id: string
    user_id: string
    vehicle_type: string
    vehicle_registration: string
    license_number: string
    kyc_status: string
    availability_status: string
    is_active?: boolean | null
    created_at: string
    updated_at: string
    total_deliveries: number
    users?: {
        email: string
        full_name: string
        phone?: string
    }
    phone?: string
    business_name?: string
    region?: string
    district?: string
    driver_license_url?: string
    id_document_url?: string
    license_document_url?: string
    vehicle_registration_document_url?: string
}

export function TransporterManagementTab() {
    const [transporters, setTransporters] = useState<Transporter[]>([])
    const [filteredTransporters, setFilteredTransporters] = useState<Transporter[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTransporter, setSelectedTransporter] = useState<Transporter | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [messageTransporter, setMessageTransporter] = useState<Transporter | null>(null)
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        fetchTransporters()
    }, [])

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredTransporters(transporters)
        } else {
            const query = searchQuery.toLowerCase()
            setFilteredTransporters(
                transporters.filter(
                    (t) =>
                        t.users?.full_name?.toLowerCase().includes(query) ||
                        t.users?.email?.toLowerCase().includes(query) ||
                        t.vehicle_registration?.toLowerCase().includes(query) ||
                        t.license_number?.toLowerCase().includes(query) ||
                        t.phone?.toLowerCase().includes(query) ||
                        t.users?.phone?.toLowerCase().includes(query)
                )
            )
        }
    }, [searchQuery, transporters])

    const fetchTransporters = async () => {
        try {
            setIsLoading(true)
            const response = await clientApiGet<{ data: Transporter[] }>("admin/transporters")
            setTransporters(response.data || [])
            setFilteredTransporters(response.data || [])
        } catch (error) {
            console.error("Error fetching transporters:", error)
            toast({
                title: "Error",
                description: "Failed to load transporters",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleActive = async (transporter: Transporter) => {
        try {
            const currentStatus = transporter.is_active ?? true
            const newStatus = !currentStatus
            await clientApiPost(`admin/transporters/${transporter.id}/${newStatus ? "activate" : "deactivate"}`)

            toast({
                title: newStatus ? "Transporter Activated" : "Transporter Deactivated",
                description: `${transporter.users?.full_name || 'Transporter'} has been ${newStatus ? "activated" : "deactivated"}`,
            })

            // Update local state
            setTransporters(transporters.map((t) => (t.id === transporter.id ? { ...t, is_active: newStatus } : t)))
            setFilteredTransporters(filteredTransporters.map((t) => (t.id === transporter.id ? { ...t, is_active: newStatus } : t)))
            if (selectedTransporter?.id === transporter.id) {
                setSelectedTransporter({ ...selectedTransporter, is_active: newStatus })
            }
        } catch (error) {
            console.error("Error toggling transporter status:", error)
            toast({
                title: "Error",
                description: "Failed to update transporter status",
                variant: "destructive",
            })
        }
    }

    const handleDeleteTransporter = async (transporterId: string) => {
        try {
            await clientApiDelete(`admin/transporters/${transporterId}`)
            toast({
                title: "Transporter Deleted",
                description: "The transporter has been permanently deleted.",
            })
            // Update local state
            setTransporters(transporters.filter((t) => t.id !== transporterId))
            setFilteredTransporters(filteredTransporters.filter((t) => t.id !== transporterId))
            setViewDialogOpen(false)
        } catch (error) {
            console.error("Error deleting transporter:", error)
            toast({
                title: "Error",
                description: "Failed to delete transporter account",
                variant: "destructive",
            })
        }
    }

    const handleViewDetails = (transporter: Transporter) => {
        setSelectedTransporter(transporter)
        setViewDialogOpen(true)
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
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transporter Management</h2>
                    <p className="text-sm text-slate-500 mt-0.5">View and manage all transporter accounts</p>
                </div>
                <Badge variant="outline" className="text-sm px-4 py-2 border-slate-200 bg-white font-semibold tabular-nums self-start sm:self-auto">
                    {transporters.length} Total Transporters
                </Badge>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search transporters by name, email, or plate number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-primary/30 placeholder:text-slate-400"
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-slate-400 to-slate-500" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Total</p>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{transporters.length}</p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                    <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Available</p>
                    <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                        {transporters.filter((t) => t.availability_status === "available").length}
                    </p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                    <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-blue-400 to-blue-500" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">KYC Approved</p>
                    <p className="text-2xl font-bold text-blue-600 tabular-nums">
                        {transporters.filter((t) => t.kyc_status === "approved").length}
                    </p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
                    <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-purple-400 to-purple-500" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Total Deliveries</p>
                    <p className="text-2xl font-bold text-purple-600 tabular-nums">
                        {transporters.reduce((sum, t) => sum + (t.total_deliveries || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Transporters List */}
            {filteredTransporters.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                        <Truck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-500">
                            {searchQuery ? "No transporters found matching your search" : "No transporters found"}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            {searchQuery ? "Try adjusting your search terms" : "Transporters will appear here once registered"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredTransporters.map((transporter, idx) => {
                        const isActive = transporter.is_active ?? true

                        return (
                            <div
                                key={transporter.id}
                                className={`group relative rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
                                    isActive ? "border-slate-200" : "border-slate-200 opacity-75"
                                }`}
                            >
                                {/* Top accent bar */}
                                <div className={`h-1 w-full ${
                                    transporter.kyc_status === "approved"
                                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                        : transporter.kyc_status === "pending"
                                            ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                            : "bg-gradient-to-r from-red-400 to-red-500"
                                }`} />

                                {/* Card Header */}
                                <div className="px-5 pt-4 pb-3">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                                            transporter.kyc_status === "approved"
                                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                                : transporter.kyc_status === "pending"
                                                    ? "bg-gradient-to-br from-amber-500 to-amber-600"
                                                    : "bg-gradient-to-br from-red-500 to-red-600"
                                        }`}>
                                            <Truck className="h-5 w-5" />
                                        </div>

                                        {/* Name & email */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                                                    #{idx + 1}
                                                </span>
                                                <h3 className="font-semibold text-slate-900 truncate text-sm leading-tight">
                                                    {transporter.users?.full_name || "Unnamed Transporter"}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate mt-0.5">{transporter.users?.email}</p>
                                        </div>

                                        {/* Status badges */}
                                        <div className="flex flex-col gap-1 shrink-0 items-end">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                isActive
                                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                                    : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                                            }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                {isActive ? "Active" : "Inactive"}
                                            </span>
                                            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 uppercase">
                                                {transporter.vehicle_type?.replace("_", " ") || "Vehicle"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="mx-5 border-t border-slate-100" />

                                {/* Details */}
                                <div className="px-5 py-3 space-y-2">
                                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>{transporter.phone || transporter.users?.phone || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>KYC: <span className="font-medium capitalize">{transporter.kyc_status || "pending"}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                        <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>Plate: <span className="font-medium font-mono">{transporter.vehicle_registration || "N/A"}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>Joined {new Date(transporter.created_at).toLocaleDateString()}</span>
                                    </div>
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
                                            onClick={() => handleViewDetails(transporter)}
                                        >
                                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                                            View Details
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-8 text-xs rounded-lg border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                            onClick={() => setMessageTransporter(transporter)}
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
                                                isActive
                                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                                            }`}
                                            onClick={() => handleToggleActive(transporter)}
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
                                                        `Are you absolutely sure you want to permanently delete this transporter? This action cannot be undone and will delete all their assignments, withdrawals, and user accounts.`
                                                    )
                                                ) {
                                                    handleDeleteTransporter(transporter.id)
                                                }
                                            }}
                                            title="Delete transporter permanently"
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

            {/* Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Transporter Details</DialogTitle>
                        <DialogDescription>Full information for {selectedTransporter?.users?.full_name}</DialogDescription>
                    </DialogHeader>
                    {selectedTransporter && (
                        <div className="grid md:grid-cols-2 gap-4 py-4">
                            <div>
                                <Label className="text-muted-foreground">Full Name</Label>
                                <p className="font-medium">{selectedTransporter.users?.full_name}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="font-medium">{selectedTransporter.users?.email}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Phone</Label>
                                <p className="font-medium">{selectedTransporter.phone || selectedTransporter.users?.phone || "N/A"}</p>
                            </div>
                            {selectedTransporter.business_name && (
                                <div>
                                    <Label className="text-muted-foreground">Business Name</Label>
                                    <p className="font-medium">{selectedTransporter.business_name}</p>
                                </div>
                            )}
                            <div>
                                <Label className="text-muted-foreground">Location</Label>
                                <p className="font-medium">
                                    {(selectedTransporter.region || selectedTransporter.district)
                                        ? `${selectedTransporter.region || ''}${selectedTransporter.region && selectedTransporter.district ? ', ' : ''}${selectedTransporter.district || ''}`
                                        : "N/A"}
                                </p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Vehicle Type</Label>
                                <p className="font-medium">{selectedTransporter.vehicle_type}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Vehicle Registration</Label>
                                <p className="font-medium">{selectedTransporter.vehicle_registration}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">License Number</Label>
                                <p className="font-medium">{selectedTransporter.license_number}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">KYC Status</Label>
                                <Badge variant="outline">{selectedTransporter.kyc_status}</Badge>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Availability</Label>
                                <Badge variant="outline">{selectedTransporter.availability_status}</Badge>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Total Deliveries</Label>
                                <p className="font-medium">{selectedTransporter.total_deliveries || 0}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Member Since</Label>
                                <p className="font-medium">{new Date(selectedTransporter.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex justify-between items-center w-full">
                        <div className="flex gap-2">
                            {selectedTransporter && (
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                `Are you absolutely sure you want to permanently delete this transporter? This action cannot be undone and will delete all their assignments, withdrawals, and user accounts.`
                                            )
                                        ) {
                                            handleDeleteTransporter(selectedTransporter.id)
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Transporter
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {selectedTransporter && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setMessageTransporter(selectedTransporter)
                                        setViewDialogOpen(false)
                                    }}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Send Message
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
      {/* Admin Message Dialog */}
      {messageTransporter && (
        <AdminMessageDialog
          isOpen={!!messageTransporter}
          onClose={() => setMessageTransporter(null)}
          recipientId={messageTransporter.user_id}
          recipientName={messageTransporter.users?.full_name || messageTransporter.business_name || "Transporter"}
        />
      )}
        </div>
    )
}
