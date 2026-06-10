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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Customer Management</h2>
                    <p className="text-muted-foreground">View all registered customers</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    {customers.length} Total Customers
                </Badge>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Customers List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((customer, idx) => (
                    <Card key={customer.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary shrink-0" />
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                                    #{idx + 1}
                                </span>
                                <span className="truncate">{customer.full_name || "Unnamed"}</span>
                            </CardTitle>
                            <CardDescription>{customer.email}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span>{customer.phone || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleViewDetails(customer)}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setMessageCustomer(customer)}
                                    title="Send Message"
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Message
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                `Are you absolutely sure you want to permanently delete customer "${customer.full_name || customer.email}"? This action cannot be undone and will delete all their orders, cart items, support tickets, and user accounts.`
                                            )
                                        ) {
                                            handleDeleteCustomer(customer.id)
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

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
