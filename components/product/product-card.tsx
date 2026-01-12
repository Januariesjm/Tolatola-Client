"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Heart, Share2, Copy, Check, MapPin, ShoppingBag, CheckCircle2, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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
    isSocialShare?: boolean
    isLiked?: boolean
    isInCart?: boolean
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
    isInCart,
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
            setShareOpen(false)
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

        if (shareUrl) {
            window.open(shareUrl, "_blank", "width=600,height=400")
            setShareOpen(false)
        }
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
            <div className="p-3 md:p-6 flex-grow flex flex-col gap-2 md:gap-3">
                <div className="space-y-1">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary">
                            <CheckCircle2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
                            <span>Verified by TOLA</span>
                        </div>
                        {product.quality_grade && (
                            <div className="px-1.5 py-0.5 rounded-md bg-stone-100 text-[8px] md:text-[9px] font-black uppercase text-stone-600">
                                Grade {product.quality_grade}
                            </div>
                        )}
                    </div>

                    <Link href={`/product/${product.id}`}>
                        <h3 className="text-sm md:text-lg font-black tracking-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer leading-tight h-10 md:h-auto">
                            {product.name}
                        </h3>
                    </Link>

                    <div className="hidden md:flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60">
                        <div className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3 text-primary/60" />
                            <span>MOQ: {product.moq || 1} {product.unit || "Units"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-primary/60" />
                            <span>Del: {product.delivery_available !== false ? "Yes" : "No"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-auto">
                    <div className="space-y-0.5">
                        <p className="text-sm md:text-xl font-black text-primary tracking-tight leading-none">
                            {product.price.toLocaleString()} <span className="text-[10px] md:text-xs uppercase">TZS</span>
                        </p>
                        {product.compare_at_price > product.price && (
                            <p className="text-[10px] md:text-xs text-muted-foreground/60 line-through decoration-destructive/30 decoration-1">
                                {product.compare_at_price.toLocaleString()} TZS
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {product.distance_km !== undefined && product.distance_km !== Infinity && (
                            <div className="flex items-center gap-1 text-[8px] md:text-[10px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-full">
                                <MapPin className="h-2 w-2 md:h-2.5 md:w-2.5" />
                                <span>{product.distance_km < 1 ? '< 1 km' : `${Math.round(product.distance_km)} km`}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="flex gap-1.5 md:gap-2 pt-2 border-t border-stone-50">
                    <Button
                        size="sm"
                        className={cn(
                            "flex-1 rounded-xl font-black text-[10px] md:text-xs shadow-md transition-all active:scale-95 h-8 md:h-10 px-2 md:px-4",
                            isInCart
                                ? "bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200 shadow-none"
                                : "hover:shadow-primary/20"
                        )}
                        onClick={() => onAddToCart && onAddToCart(product)}
                    >
                        {isInCart ? (
                            <>
                                <Check className="h-3.5 w-3.5 mr-1.5 md:mr-2 text-green-600" />
                                <span>In Cart</span>
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="h-3.5 w-3.5 mr-1.5 md:mr-2" />
                                <span>Cart</span>
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className={`h-8 w-8 md:h-10 md:w-10 rounded-xl border-stone-100 hover:border-destructive hover:bg-destructive/5 transition-all ${initialIsLiked ? "bg-destructive/10 border-destructive text-destructive" : "text-muted-foreground"}`}
                        onClick={() => onToggleLike && onToggleLike(product.id)}
                    >
                        <Heart className={`h-3.5 w-3.5 md:h-4 md:w-4 ${initialIsLiked ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 md:h-10 md:w-10 rounded-xl border-stone-100 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setShareOpen(true)
                        }}
                    >
                        <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                </div>
            </div>

            {/* Share Dialog */}
            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Share Product</DialogTitle>
                        <DialogDescription>
                            Share {product.name} with your friends and family
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 hover:bg-stone-50"
                            onClick={handleCopyLinkInternal}
                        >
                            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-stone-600" />}
                            <span className={`font-bold ${copied ? "text-green-600" : ""}`}>{copied ? "Link Copied!" : "Copy Link"}</span>
                        </Button>

                        <div className="h-px bg-stone-100 my-2" />

                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                            onClick={() => handleSocialShareInternal("whatsapp")}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <span className="font-bold">WhatsApp</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                            onClick={() => handleSocialShareInternal("facebook")}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span className="font-bold">Facebook</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200"
                            onClick={() => handleSocialShareInternal("twitter")}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span className="font-bold">Twitter (X)</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                            onClick={() => handleSocialShareInternal("linkedin")}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            <span className="font-bold">LinkedIn</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 hover:bg-sky-50 hover:text-sky-500 hover:border-sky-200"
                            onClick={() => handleSocialShareInternal("telegram")}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                            <span className="font-bold">Telegram</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
