"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Mail, Phone, Calendar, User, Eye, MapPin, Trash2, MessageSquare } from "lucide-react"
import { clientApiGet, clientApiDelete } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AdminMessageDialog } from "@/components/admin/message-dialog"

interface Customer {
    id: string
    email: string
    full_name: string
    phone?: string
    created_at: string
    // Add other fields as needed
}

export function CustomerManagementTab() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [messageCustomer, setMessageCustomer] = useState<Customer | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchCustomers()
    }, [])

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredCustomers(customers)
        } else {
            const query = searchQuery.toLowerCase()
            setFilteredCustomers(
                customers.filter(
                    (c) =>
                        c.full_name?.toLowerCase().includes(query) ||
                        c.email?.toLowerCase().includes(query) ||
                        c.phone?.toLowerCase().includes(query)
                )
            )
        }
    }, [searchQuery, customers])

    const fetchCustomers = async () => {
        try {
            setIsLoading(true)
            const response = await clientApiGet<{ data: Customer[] }>("admin/customers")
            setCustomers(response.data || [])
            setFilteredCustomers(response.data || [])
        } catch (error) {
            console.error("Error fetching customers:", error)
            toast({
                title: "Error",
                description: "Failed to load customers",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteCustomer = async (customerId: string) => {
        try {
            await clientApiDelete(`admin/customers/${customerId}`)
            toast({
                title: "Customer Deleted",
                description: "The customer has been permanently deleted.",
            })
            // Update local state
            setCustomers(customers.filter((c) => c.id !== customerId))
            setFilteredCustomers(filteredCustomers.filter((c) => c.id !== customerId))
            setViewDialogOpen(false)
        } catch (error) {
            console.error("Error deleting customer:", error)
            toast({
                title: "Error",
                description: "Failed to delete customer account",
                variant: "destructive",
            })
        }
    }

    const handleViewDetails = (customer: Customer) => {
        setSelectedCustomer(customer)
        setViewDialogOpen(true)
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
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Customer Management</h2>
                    <p className="text-sm text-slate-500 mt-0.5">View and manage all registered customer accounts</p>
                </div>
                <Badge variant="outline" className="text-sm px-4 py-2 border-slate-200 bg-white font-semibold tabular-nums self-start sm:self-auto">
                    {customers.length} Total Customers
                </Badge>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search customers by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-primary/30 placeholder:text-slate-400"
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-slate-400 to-slate-500" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Total Customers</p>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{customers.length}</p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                    <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-blue-400 to-blue-500" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">With Phone</p>
                    <p className="text-2xl font-bold text-blue-600 tabular-nums">
                        {customers.filter((c) => !!c.phone).length}
                    </p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-4 shadow-sm col-span-2 md:col-span-1">
                    <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Recent Registrations</p>
                    <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                        {customers.filter((c) => {
                            const date = new Date(c.created_at)
                            const now = new Date()
                            const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 3600 * 24))
                            return diffDays <= 30
                        }).length}
                    </p>
                </div>
            </div>

            {/* Customers List */}
            {filteredCustomers.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                        <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-500">
                            {searchQuery ? "No customers found matching your search" : "No customers found"}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            {searchQuery ? "Try adjusting your search terms" : "Registered customers will appear here"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredCustomers.map((customer, idx) => (
                        <div
                            key={customer.id}
                            className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            {/* Top accent bar */}
                            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />

                            {/* Card Header */}
                            <div className="px-5 pt-4 pb-3">
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600">
                                        {customer.full_name?.charAt(0)?.toUpperCase() || customer.email?.charAt(0)?.toUpperCase() || "C"}
                                    </div>

                                    {/* Name & email */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                                                #{idx + 1}
                                            </span>
                                            <h3 className="font-semibold text-slate-900 truncate text-sm leading-tight">
                                                {customer.full_name || "Unnamed Customer"}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">{customer.email}</p>
                                    </div>

                                    {/* Role Badge */}
                                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 shrink-0">
                                        Customer
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="mx-5 border-t border-slate-100" />

                            {/* Details */}
                            <div className="px-5 py-3 space-y-2">
                                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{customer.email}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span>{customer.phone || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-5 pb-4 pt-2 space-y-2">
                                <div className="border-t border-slate-100 pt-3" />
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-8 text-xs rounded-lg border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                        onClick={() => handleViewDetails(customer)}
                                    >
                                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                                        Details
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-8 text-xs rounded-lg border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                        onClick={() => setMessageCustomer(customer)}
                                    >
                                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                        Message
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-lg border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors shrink-0"
                                        onClick={() => {
                                            if (
                                                confirm(
                                                    `Are you absolutely sure you want to permanently delete customer "${customer.full_name || customer.email}"? This action cannot be undone and will delete all their orders, cart items, support tickets, and user accounts.`
                                                )
                                            ) {
                                                handleDeleteCustomer(customer.id)
                                            }
                                        }}
                                        title="Delete customer permanently"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Customer Details</DialogTitle>
                        <DialogDescription>Full information for {selectedCustomer?.full_name}</DialogDescription>
                    </DialogHeader>
                    {selectedCustomer && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Full Name</Label>
                                    <p className="font-medium">{selectedCustomer.full_name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium">{selectedCustomer.email}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Phone</Label>
                                    <p className="font-medium">{selectedCustomer.phone || "N/A"}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Joined At</Label>
                                    <p className="font-medium">{new Date(selectedCustomer.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex justify-between items-center w-full">
                        <div className="flex gap-2">
                            {selectedCustomer && (
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                `Are you absolutely sure you want to permanently delete customer "${selectedCustomer.full_name || selectedCustomer.email}"? This action cannot be undone and will delete all their orders, cart items, support tickets, and user accounts.`
                                            )
                                        ) {
                                            handleDeleteCustomer(selectedCustomer.id)
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Customer
                                </Button>
                            )}
                        </div>
                         <div className="flex gap-2">
                            {selectedCustomer && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setMessageCustomer(selectedCustomer)
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
      {messageCustomer && (
        <AdminMessageDialog
          isOpen={!!messageCustomer}
          onClose={() => setMessageCustomer(null)}
          recipientId={messageCustomer.id}
          recipientName={messageCustomer.full_name || messageCustomer.email}
        />
      )}
        </div>
    )
}
