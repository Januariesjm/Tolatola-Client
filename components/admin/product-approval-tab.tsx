"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"
import { clientApiPost } from "@/lib/api-client"
import { useRouter } from "next/navigation"

interface ProductApprovalTabProps {
  products: any[]
}

export function ProductApprovalTab({ products }: ProductApprovalTabProps) {
  const router = useRouter()

  const handleApprove = async (productId: string) => {
    try {
      await clientApiPost(`admin/products/${productId}/approve`)
      router.refresh()
    } catch (error) {
      console.error("Error approving product:", error)
      alert("Failed to approve product")
    }
  }

  const handleReject = async (productId: string) => {
    try {
      await clientApiPost(`admin/products/${productId}/reject`)
      router.refresh()
    } catch (error) {
      console.error("Error rejecting product:", error)
      alert("Failed to reject product")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Approvals</h2>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No pending products</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id}>
              <div className="aspect-square bg-muted">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge className="bg-yellow-500">Pending</Badge>
                </div>
                <CardDescription>{product.shops?.vendors?.business_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold">TZS {product.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                    <span>{product.stock_quantity}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(product.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                    onClick={() => handleReject(product.id)}
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
    </div>
  )
}
