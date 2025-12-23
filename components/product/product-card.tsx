"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Heart, Share2, Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
    product: any
    badge?: {
        text: string
        variant: "new" | "deal"
    }
    isTrending?: boolean
    // Optional handlers if the parent wants to override behavior, 
    // though we'll implement default behavior here to be self-sufficient if possible,
    // or at least compatible with both parents.
    onAddToCart?: (product: any) => void
    onToggleLike?: (productId: string) => void
    onCopyLink?: (product: any) => void
    onSocialShare?: (product: any, platform: string) => void
    // State from parent if controlled
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
    // Local state for share popover - supports both hover (desktop) and click (mobile)
    const [shareOpen, setShareOpen] = useState(false)

    // We can use local state for immediate feedback if handlers are not passed or just for UI
    // But ideally, the parent manages data. 
    // Let's assume passed handlers handle the logic, but for "copy link" we can do it here if not passed.
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
            if (!navigator.clipboard) {
                // Fallback
                const textArea = document.createElement('textarea')
                textArea.value = productUrl
                textArea.style.position = 'fixed'
                textArea.style.opacity = '0'
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
            } else {
                await navigator.clipboard.writeText(productUrl)
            }
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast({
                title: "Link copied!",
                description: "Product link copied to clipboard",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to copy link",
                variant: "destructive",
            })
        }
    }

    const handleSocialShareInternal = (platform: string) => {
        if (onSocialShare) {
            onSocialShare(product, platform)
            return
        }

        // Default implementation if not provided
        const productUrl = `${window.location.origin}/product/${product.id}`
        const text = `Check out ${product.name} on TOLA!`
        let shareUrl = ""

        switch (platform) {
            case "facebook":
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`
                break
            case "twitter":
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`
                break
            case "whatsapp":
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + productUrl)}`
                break
            case "linkedin":
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`
                break
            case "telegram":
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`
                break
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank", "width=600,height=400")
        }
    }

    return (
        <Card className="group flex-shrink-0 w-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-card flex flex-col h-full">
            <Link href={`/product/${product.id}`}>
                <div className="relative aspect-square overflow-hidden bg-muted cursor-pointer">
                    {product.images && product.images.length > 0 ? (
                        <Image
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/20" />
                        </div>
                    )}

                    {/* Badges */}
                    {badge && (
                        <div
                            className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold shadow-lg ${badge.variant === "new"
                                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                                : "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground"
                                }`}
                        >
                            {badge.text}
                        </div>
                    )}
                    {isTrending && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                            Trending
                        </div>
                    )}
                    {product.compare_at_price && product.compare_at_price > product.price && (
                        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                            {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            </Link>
            <CardHeader className="p-2 sm:p-3 md:p-4 space-y-1 flex-grow">
                <Link href={`/product/${product.id}`}>
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg line-clamp-1 hover:text-primary transition-colors cursor-pointer">
                        {product.name}
                    </CardTitle>
                </Link>
                <CardDescription className="text-xs sm:text-sm line-clamp-2">{product.description}</CardDescription>

                <div className="space-y-0.5 mt-auto">
                    <div className="flex items-baseline gap-2">
                        <p className="text-sm sm:text-base lg:text-lg font-bold text-primary">
                            {product.price.toLocaleString()} TZS
                        </p>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                            <p className="text-[11px] sm:text-xs text-muted-foreground line-through">
                                {product.compare_at_price.toLocaleString()} TZS
                            </p>
                        )}
                    </div>
                </div>

                <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
                    by {product.shops?.vendors?.business_name || product.shops?.name || "Unknown Vendor"}
                </p>

                {locationLabel ? (
                    <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
                        📍 Location: {locationLabel}
                    </p>
                ) : (
                    <p className="text-[11px] sm:text-xs text-muted-foreground/50 line-clamp-1 italic">
                        📍 Location: Not specified
                    </p>
                )}
            </CardHeader>

            <CardContent className="p-2 sm:p-3 md:p-4 pt-0 flex gap-2 mt-auto">
                <div className="flex gap-2 flex-1">
                    <Button
                        className="flex-1 shadow-md hover:shadow-lg transition-shadow text-[11px] sm:text-xs"
                        size="sm"
                        onClick={() => onAddToCart && onAddToCart(product)}
                    >
                        <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        <span>Add</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className={`h-8 w-8 sm:h-9 sm:w-9 ${initialIsLiked ? "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20" : ""}`}
                        onClick={() => onToggleLike && onToggleLike(product.id)}
                    >
                        <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${initialIsLiked ? "fill-current" : ""}`} />
                    </Button>
                </div>

                <Popover open={shareOpen} onOpenChange={(open) => {
                    console.log('[SharePopover] onOpenChange:', open)
                    setShareOpen(open)
                }}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9 bg-transparent relative z-50"
                            onMouseEnter={() => {
                                console.log('[ShareButton] onMouseEnter')
                                setShareOpen(true)
                            }}
                            onClick={(e) => {
                                console.log('[ShareButton] onClick, current shareOpen:', shareOpen)
                                e.stopPropagation()
                                // If already open, let Radix handle it (usually toggles)
                                // If closed, Radix will open it.
                            }}
                        >
                            <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-64 p-3 z-[9999]"
                        align="end"
                        side="top"
                        sideOffset={8}
                        onMouseEnter={() => console.log('[PopoverContent] onMouseEnter')}
                        onMouseLeave={() => {
                            console.log('[PopoverContent] onMouseLeave')
                            setShareOpen(false)
                        }}
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-2">
                            <p className="text-sm font-semibold mb-3">Share this product</p>

                            {/* Copy Link Button */}
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2 bg-transparent"
                                size="sm"
                                onClick={handleCopyLinkInternal}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 text-green-600" />
                                        <span>Link Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        <span>Copy Link</span>
                                    </>
                                )}
                            </Button>

                            {/* Social Media Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    className="justify-start gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-[#1877F2]"
                                    size="sm"
                                    onClick={() => handleSocialShareInternal("facebook")}
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    <span className="text-xs">Facebook</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="justify-start gap-2 bg-black hover:bg-black/90 text-white border-black"
                                    size="sm"
                                    onClick={() => handleSocialShareInternal("twitter")}
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    <span className="text-xs">X/Twitter</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="justify-start gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white border-[#25D366]"
                                    size="sm"
                                    onClick={() => handleSocialShareInternal("whatsapp")}
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                    <span className="text-xs">WhatsApp</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="justify-start gap-2 bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white border-[#0A66C2]"
                                    size="sm"
                                    onClick={() => handleSocialShareInternal("linkedin")}
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.063 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    <span className="text-xs">LinkedIn</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="justify-start gap-2 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white border-[#0088cc] col-span-2"
                                    size="sm"
                                    onClick={() => handleSocialShareInternal("telegram")}
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                    </svg>
                                    <span className="text-xs">Telegram</span>
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </CardContent>
        </Card>
    )
}
