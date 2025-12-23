"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Truck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function CartPopover() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverContentRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const loadCart = () => {
      const items = JSON.parse(localStorage.getItem("cart") || "[]")
      setCartItems(items)
    }

    loadCart()
    window.addEventListener("storage", loadCart)
    window.addEventListener("cartUpdated", loadCart)

    return () => {
      window.removeEventListener("storage", loadCart)
      window.removeEventListener("cartUpdated", loadCart)
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(true)
  }, [isMobile])

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }, [isMobile])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    },
    [isMobile],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isMobile || !isOpen) return

    const handleClickOutside = (e: TouchEvent | MouseEvent) => {
      const target = e.target as Node

      // Check if click is inside the container (trigger) or popover content
      if (containerRef.current?.contains(target)) {
        return
      }

      // Check if click is inside the popover content (which is portaled)
      const popoverElement = document.querySelector("[data-radix-popper-content-wrapper]")
      if (popoverElement?.contains(target)) {
        return
      }

      setIsOpen(false)
    }

    // Use a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("touchend", handleClickOutside)
      document.addEventListener("click", handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("touchend", handleClickOutside)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isMobile, isOpen])

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

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <div ref={containerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="relative inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
            onClick={handleClick}
            type="button"
          >
            <ShoppingCart className="h-6 w-6" strokeWidth={2.5} />
            <span className="font-bold text-base hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold"
              >
                {totalItems}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          ref={popoverContentRef}
          className="w-96 p-0"
          align="end"
          sideOffset={8}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="max-h-[500px] overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
                {totalItems > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </Badge>
                )}
              </h3>
            </div>

            {/* Cart Items */}
            {cartItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Your cart is empty</p>
                <Link href="/shop" onClick={() => setIsOpen(false)}>
                  <Button variant="link" className="mt-2">
                    Browse Products
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={
                            item.product.images && item.product.images.length > 0
                              ? item.product.images[0]
                              : `/placeholder.svg?height=64&width=64&query=${encodeURIComponent(item.product.name)}`
                          }
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.product.shops?.vendors?.business_name || item.product.shops?.name || "Unknown Vendor"}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 bg-transparent"
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 bg-transparent"
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock_quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Price */}
                          <span className="text-sm font-semibold">
                            TZS {(item.product.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => removeItem(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Subtotal</span>
                    <span className="text-lg font-bold">TZS {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    <span>Delivery fee (TZS 3,000 - 15,000) calculated at checkout based on distance</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/cart" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full bg-transparent">
                        View Cart
                      </Button>
                    </Link>
                    <Link href="/checkout" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">
                        Checkout
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
