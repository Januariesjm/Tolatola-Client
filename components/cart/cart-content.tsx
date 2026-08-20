"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Trash2, Plus, Minus, Truck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import { useLanguage } from "@/lib/i18n/language-context"

export function CartContent() {
  const { t } = useLanguage()
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

  const getItemId = (item: any) => `${item.product_id}-${item.selected_color?.name || ""}-${item.selected_size || ""}`

  const updateQuantity = (itemId: string, newQuantity: number) => {
    const updatedCart = cartItems.map((item) => (getItemId(item) === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item))
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    setCartItems(updatedCart)
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const removeItem = (itemId: string) => {
    const updatedCart = cartItems.filter((item) => getItemId(item) !== itemId)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    setCartItems(updatedCart)
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const deliveryFee = 5000
  const total = subtotal + deliveryFee

  const handleCheckout = () => {
    router.push("/checkout")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-3 sm:px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{t("cart.title")}</h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            {cartItems.length} {t("cart.items_in_cart")}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="rounded-2xl border-stone-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">{t("cart.empty")}</p>
              <Link href="/shop">
                <Button className="rounded-xl">{t("cart.continue_shopping")}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              {cartItems.map((item) => {
                const itemId = getItemId(item)
                return (
                  <Card key={itemId} className="rounded-2xl border-stone-200/80 shadow-sm overflow-hidden">
                    <CardContent className="p-3 sm:p-4 md:p-6">
                      <div className="flex gap-3 md:gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-stone-100">
                          <img
                            src={
                              item.selected_color?.image ||
                              (item.product.images && item.product.images.length > 0
                                ? item.product.images[0]
                                : `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(item.product.name)}`)
                            }
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-sm md:text-base text-stone-900 leading-snug truncate pr-1">
                              {item.product.name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0 -mt-1 -mr-1"
                              onClick={() => removeItem(itemId)}
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-[11px] md:text-xs text-muted-foreground mb-1.5 truncate">{t("cart.by_verified_vendor")}</p>

                          {/* Color & Size Variation Badge */}
                          {(item.selected_color || item.selected_size) && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {item.selected_color && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-stone-300"
                                    style={{ backgroundColor: item.selected_color.name.toLowerCase() }}
                                  />
                                  {t("cart.color") || "Color"}: {item.selected_color.name}
                                </span>
                              )}
                              {item.selected_size && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                                  {t("cart.size") || "Size"}: {item.selected_size}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-stone-100 sm:border-0 sm:pt-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 rounded-lg p-0"
                                onClick={() => updateQuantity(itemId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-7 sm:w-10 text-center font-bold text-xs sm:text-sm">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 rounded-lg p-0"
                                onClick={() => updateQuantity(itemId, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock_quantity}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-xs sm:text-base font-extrabold text-primary">
                              TZS {(item.product.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-24 rounded-2xl md:rounded-3xl border-stone-200 shadow-sm">
                <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold">{t("cart.order_summary")}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                      <span className="font-bold">TZS {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" />
                        {t("cart.delivery")}
                      </span>
                      <span className="font-bold">TZS {deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground bg-muted/60 p-2.5 rounded-xl border border-stone-200/50 leading-relaxed">
                      {t("cart.delivery_calc_info")}
                    </div>
                    <div className="border-t pt-2.5 flex justify-between font-extrabold text-base md:text-lg">
                      <span>{t("cart.total")}</span>
                      <span className="text-primary">TZS {total.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full h-11 md:h-12 rounded-xl text-sm font-extrabold shadow-md shadow-primary/20"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isCheckingAuth}
                  >
                    {isCheckingAuth ? t("common.loading") : t("cart.proceed")}
                  </Button>
                  <Link href="/shop" className="block">
                    <Button variant="outline" className="w-full h-11 md:h-12 rounded-xl text-sm font-bold bg-transparent border-stone-200">
                      {t("cart.continue_shopping")}
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
