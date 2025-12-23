"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Trash2, Plus, Minus, Truck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function CartContent() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      setIsCheckingAuth(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("cart") || "[]")
    setCartItems(items)
  }, [])

  const updateQuantity = (productId: string, newQuantity: number) => {
    const updatedCart = cartItems.map((item) =>
      item.product_id === productId ? { ...item, quantity: Math.max(1, newQuantity) } : item,
    )
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    setCartItems(updatedCart)
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const removeItem = (productId: string) => {
    const updatedCart = cartItems.filter((item) => item.product_id !== productId)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    setCartItems(updatedCart)
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const deliveryFee = 5000
  const total = subtotal + deliveryFee

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/auth/login?returnUrl=/checkout")
    } else {
      router.push("/checkout")
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">{cartItems.length} items in your cart</p>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Link href="/shop">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.product_id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={
                            item.product.images && item.product.images.length > 0
                              ? item.product.images[0]
                              : `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(item.product.name)}`
                          }
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          by{" "}
                          {item.product.shops?.vendors?.business_name || item.product.shops?.name || "Unknown Vendor"}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock_quantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-lg font-semibold">
                            TZS {(item.product.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item.product_id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>TZS {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Delivery Fee
                      </span>
                      <span>TZS {deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      Delivery fee will be calculated based on your location at checkout
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>TZS {total.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isCheckingAuth}>
                    {isCheckingAuth ? "Loading..." : isAuthenticated ? "Proceed to Checkout" : "Login to Checkout"}
                  </Button>
                  <Link href="/shop">
                    <Button variant="outline" className="w-full bg-transparent">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
