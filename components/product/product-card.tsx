"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Heart, Share2, Copy, Check, Star, MapPin, Store, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
    product: any
    badge?: {
        text: string
        variant: "new" | "deal"
    }
    isTrending?: boolean
    onAddToCart?: (product: any) => void
    onToggleLike?: (productId: string) => void
    onCopyLink?: (product: any) => void
    onSocialShare?: (product: any, platform: string) => void
    isLiked?: boolean
}

export function ProductCard({
    product,
    badge,
    isTrending,
    onAddToCart,
    onToggleLike,
    onCopyLink,
    onSocialShare,
    isLiked: initialIsLiked,
}: ProductCardProps) {
    const { toast } = useToast()
    const [shareOpen, setShareOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const shop = product.shops
    const locationParts = [shop?.district, shop?.region].filter(Boolean)
    const locationLabel = locationParts.length > 0 ? locationParts.join(", ") : null

    const handleCopyLinkInternal = async () => {
        if (onCopyLink) {
            onCopyLink(product)
            return
        }

        const productUrl = `${window.location.origin}/product/${product.id}`
        try {
            await navigator.clipboard.writeText(productUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast({ title: "Link copied!", description: "Product link copied to clipboard" })
        } catch {
            toast({ title: "Error", description: "Failed to copy link", variant: "destructive" })
        }
    }

    const handleSocialShareInternal = (platform: string) => {
        if (onSocialShare) {
            onSocialShare(product, platform)
            return
        }

        const productUrl = `${window.location.origin}/product/${product.id}`
        const text = `Check out ${product.name} on TOLA!`
        let shareUrl = ""

        switch (platform) {
            case "facebook": shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`; break
            case "twitter": shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`; break
            case "whatsapp": shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + productUrl)}`; break
            case "linkedin": shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`; break
            case "telegram": shareUrl = `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`; break
        }

        if (shareUrl) window.open(shareUrl, "_blank", "width=600,height=400")
    }

    return (
        <Card className="group relative flex-shrink-0 w-full overflow-hidden border-none bg-white rounded-[2rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col">
            {/* Image Section */}
            <Link href={`/product/${product.id}`}>
                <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 cursor-pointer">
                    {product.images?.[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-100">
                            <ShoppingBag className="h-12 w-12 text-stone-200" />
                        </div>
                    )}

                    {/* Sophisticated Badges */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                        {badge && (
                            <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border border-white/20 ${badge.variant === "new" ? "bg-primary/90 text-white" : "bg-destructive/90 text-white"
                                }`}>
                                {badge.text}
                            </div>
                        )}
                        {product.compare_at_price > product.price && (
                            <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-destructive font-black text-[10px] shadow-xl border border-white/20">
                                {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
                            </div>
                        )}
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
            </Link>

            {/* Details Section */}
            <div className="p-6 flex-grow flex flex-col gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                        <Store className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{product.shops?.vendors?.business_name || product.shops?.name || "Tola Merchant"}</span>
                    </div>
                    <Link href={`/product/${product.id}`}>
                        <h3 className="text-lg font-black tracking-tight line-clamp-1 hover:text-primary transition-colors cursor-pointer leading-tight">
                            {product.name}
                        </h3>
                    </Link>
                </div>

                <div className="flex items-end justify-between mt-auto">
                    <div className="space-y-0.5">
                        <p className="text-xl font-black text-primary tracking-tight leading-none">
                            {product.price.toLocaleString()} <span className="text-xs uppercase">TZS</span>
                        </p>
                        {product.compare_at_price > product.price && (
                            <p className="text-xs text-muted-foreground/60 line-through decoration-destructive/30 decoration-1">
                                {product.compare_at_price.toLocaleString()} TZS
                            </p>
                        )}
                    </div>
                    {locationLabel && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[80px]">{locationLabel}</span>
                        </div>
                    )}
                </div>

                {/* Quick Actions Bar */}
                <div className="flex gap-2 pt-2 border-t border-stone-50">
                    <Button
                        size="sm"
                        className="flex-1 rounded-xl font-black text-xs shadow-md hover:shadow-primary/20 transition-all active:scale-95 h-10"
                        onClick={() => onAddToCart && onAddToCart(product)}
                    >
                        <ShoppingCart className="h-3.5 w-3.5 mr-2" />
                        Add to Cart
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className={`h-10 w-10 rounded-xl border-stone-100 hover:border-destructive hover:bg-destructive/5 transition-all ${initialIsLiked ? "bg-destructive/10 border-destructive text-destructive" : "text-muted-foreground"}`}
                        onClick={() => onToggleLike && onToggleLike(product.id)}
                    >
                        <Heart className={`h-4 w-4 ${initialIsLiked ? "fill-current" : ""}`} />
                    </Button>
                    <Popover open={shareOpen} onOpenChange={setShareOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-xl border-stone-100 text-muted-foreground hover:text-primary transition-all relative z-10"
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 rounded-[1.5rem] shadow-2xl border-none z-[100]" align="end" sideOffset={12}>
                            <div className="space-y-1">
                                <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl font-bold text-sm" onClick={handleCopyLinkInternal}>
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    {copied ? "Link Copied!" : "Copy Link"}
                                </Button>
                                <div className="h-px bg-stone-100 my-1 mx-2" />
                                <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl font-bold text-sm h-10 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleSocialShareInternal("whatsapp")}>
                                    <span className="text-xl">💬</span> WhatsApp
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl font-bold text-sm h-10 hover:bg-stone-50 hover:text-stone-900" onClick={() => handleSocialShareInternal("facebook")}>
                                    <span className="text-xl">👥</span> Facebook
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </Card>
    )
}
