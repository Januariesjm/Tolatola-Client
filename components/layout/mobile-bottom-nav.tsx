"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    ShoppingCart,
    Grid3x3,
    ChevronRight,
    Bell
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { clientApiGet } from "@/lib/api-client"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { getUserConversations } from "@/app/actions/messaging"
import { fetchUnreadCount } from "@/lib/services/notifications.service"

import { useLanguage } from "@/lib/i18n/language-context"
import { getCategoryTranslation } from "@/lib/i18n/translations"

const categoryImageMap: Record<string, string> = {
    "fast-moving-consumer-goods": "/category-fmcg.jpg",
    agriculture: "/category-agriculture.jpg",
    "construction-hardware": "/category-hardware.jpg",
    handicrafts: "/category-handicrafts.jpg",
    "food-beverages": "/category-food-beverages.jpg",
    textiles: "/category-textiles.jpg",
    fashion: "/category-textiles.jpg",
    electronics: "/category-electronics.jpg",
    "home-garden": "/category-home-garden.jpg",
    "health-beauty": "/category-health-beauty.jpg",
    services: "/category-services.jpg",
    vehicles: "/category-vehicles.jpg",
    "vehicles-sub": "/category-vehicles-sub.jpg",
    "ready-to-eat": "/category-ready-to-eat.jpg",
    "spare-parts": "/category-spare-parts.jpg",
    drinks: "/category-drinks.jpg",
    "non-alcoholic": "/category-non-alcoholic.jpg",
    alcoholic: "/category-alcoholic.jpg",
    motorcycles: "/category-motorcycles.jpg",
    men: "/category-textiles.jpg",
    women: "/category-textiles.jpg",
    kids: "/category-textiles.jpg",
}

export function MobileBottomNav() {
    const { t } = useLanguage()
    const pathname = usePathname()
    const [categories, setCategories] = useState<any[]>([])
    const [cartCount, setCartCount] = useState(0)
    const [unreadCount, setUnreadCount] = useState(0)
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
    const supabase = createClient()

    const loadUnreadCount = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                setUnreadCount(0)
                return
            }
            const [globalUnread, convResult] = await Promise.all([
                fetchUnreadCount().catch(() => 0),
                getUserConversations().catch(() => ({ conversations: [] }))
            ])
            const unreadConvs = (convResult.conversations || []).reduce((acc: number, c: any) => acc + (c.unread_count || 0), 0)
            setUnreadCount(globalUnread + unreadConvs)
        } catch (error) {
            console.error("Error fetching unread count for bottom nav:", error)
        }
    }, [supabase])

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await clientApiGet<{ data: any[] }>("categories")
                setCategories(res.data || [])
            } catch (error) {
                console.error("Error fetching categories for mobile nav:", error)
            }
        }

        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]")
            const count = cart.reduce((acc: number, item: any) => acc + item.quantity, 0)
            setCartCount(count)
        }

        fetchCategories()
        updateCartCount()

        window.addEventListener("cartUpdated", updateCartCount)
        window.addEventListener("storage", updateCartCount)

        return () => {
            window.removeEventListener("cartUpdated", updateCartCount)
            window.removeEventListener("storage", updateCartCount)
        }
    }, [])

    useEffect(() => {
        let channel: any = null

        const setupAuthAndRealtime = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                loadUnreadCount()

                channel = supabase
                    .channel("bottom_nav_notifications_realtime")
                    .on(
                        "postgres_changes",
                        {
                            event: "INSERT",
                            schema: "public",
                            table: "messages",
                        },
                        () => {
                            loadUnreadCount()
                        },
                    )
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "notifications",
                        },
                        () => {
                            loadUnreadCount()
                        },
                    )
                    .subscribe()
            } else {
                setUnreadCount(0)
            }
        }

        setupAuthAndRealtime()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                loadUnreadCount()
                if (!channel) {
                    channel = supabase
                        .channel("bottom_nav_notifications_realtime")
                        .on(
                            "postgres_changes",
                            {
                                event: "INSERT",
                                schema: "public",
                                table: "messages",
                            },
                            () => {
                                loadUnreadCount()
                            },
                        )
                        .on(
                            "postgres_changes",
                            {
                                event: "*",
                                schema: "public",
                                table: "notifications",
                            },
                            () => {
                                loadUnreadCount()
                            },
                        )
                        .subscribe()
                }
            } else {
                setUnreadCount(0)
                if (channel) {
                    supabase.removeChannel(channel)
                    channel = null
                }
            }
        })

        return () => {
            subscription.unsubscribe()
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [loadUnreadCount, supabase])

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-1">
            <nav className="bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] rounded-full h-16 flex items-center justify-around relative overflow-hidden">
                {/* 1. Home */}
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative z-10",
                        pathname === "/" ? "text-[#1D61E7]" : "text-stone-400 hover:text-stone-600"
                    )}
                >
                    <div className="relative">
                        <Home className={cn("h-5 w-5 transition-transform", pathname === "/" ? "scale-110 stroke-[2.4]" : "stroke-[1.8]")} />
                    </div>
                    <span className={cn("text-[10px] font-bold tracking-tight", pathname === "/" ? "text-[#1D61E7]" : "text-stone-500")}>
                        {t("nav.home")}
                    </span>
                    {pathname === "/" && (
                        <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#1D61E7] rounded-full shadow-xs" />
                    )}
                </Link>

                {/* 2. Categories Menu (triggers Sheet) */}
                <Sheet open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
                    <SheetTrigger asChild>
                        <button className={cn(
                            "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors relative z-10",
                            isCategoriesOpen ? "text-[#1D61E7]" : "text-stone-400 hover:text-stone-600"
                        )}>
                            <Grid3x3 className="h-5 w-5 stroke-[1.8]" />
                            <span className="text-[10px] font-bold tracking-tight text-stone-500">{t("nav.categories")}</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[70vh] rounded-t-[2.5rem] border-none p-0 bg-white">
                        <SheetHeader className="p-6 border-b border-stone-100">
                            <SheetTitle className="text-xl font-black tracking-tight text-stone-900">{t("nav.explore_categories")}</SheetTitle>
                        </SheetHeader>
                        <div className="overflow-y-auto h-full pb-20 p-6">
                            <div className="flex flex-wrap justify-start gap-x-5 gap-y-5">
                                {/* All Categories tile */}
                                <Link
                                    href="/shop"
                                    onClick={() => setIsCategoriesOpen(false)}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                                        <Grid3x3 className="h-7 w-7" />
                                    </div>
                                    <span className="text-[11px] font-extrabold text-primary text-center leading-tight max-w-[72px]">{t("category.all")}</span>
                                </Link>

                                {/* Category tiles */}
                                {categories.filter(c => !c.parent_id).sort((a, b) => {
                                    const isAService = a.slug === "services" || a.name?.toLowerCase() === "services"
                                    const isBService = b.slug === "services" || b.name?.toLowerCase() === "services"
                                    if (isAService && !isBService) return 1
                                    if (!isAService && isBService) return -1
                                    return 0
                                }).map((cat) => {
                                    const imageUrl = cat.image_url || categoryImageMap[cat.slug] || "/abstract-categories.png"
                                    return (
                                        <Link
                                            key={cat.id}
                                            href={`/shop?category=${cat.slug}`}
                                            onClick={() => setIsCategoriesOpen(false)}
                                            className="flex flex-col items-center gap-2 group"
                                        >
                                            <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-stone-50 border border-stone-200/80 group-hover:border-primary/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                                                <Image src={imageUrl} alt={cat.name} fill className="object-cover" />
                                            </div>
                                            <span className="text-[11px] font-bold text-stone-700 text-center leading-tight max-w-[72px] line-clamp-2">{getCategoryTranslation(cat.slug, cat.name, t)}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* 3. Messages / Notifications */}
                <Link
                    href="/messages"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative z-10",
                        pathname === "/messages" ? "text-[#1D61E7]" : "text-stone-400 hover:text-stone-600"
                    )}
                >
                    <div className="relative">
                        <Bell className={cn("h-5 w-5 transition-transform", pathname === "/messages" ? "scale-110 stroke-[2.4]" : "stroke-[1.8]")} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 bg-[#E53E3E] text-white text-[8px] font-extrabold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>
                    <span className={cn("text-[10px] font-bold tracking-tight", pathname === "/messages" ? "text-[#1D61E7]" : "text-stone-500")}>
                        {t("nav.messages")}
                    </span>
                    {pathname === "/messages" && (
                        <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#1D61E7] rounded-full shadow-xs" />
                    )}
                </Link>

                {/* 4. Cart */}
                <Link
                    href="/cart"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative z-10",
                        pathname === "/cart" ? "text-[#1D61E7]" : "text-stone-400 hover:text-stone-600"
                    )}
                >
                    <div className="relative">
                        <ShoppingCart className={cn("h-5 w-5 transition-transform", pathname === "/cart" ? "scale-110 stroke-[2.4]" : "stroke-[1.8]")} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 bg-[#E53E3E] text-white text-[8px] font-extrabold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                                {cartCount > 99 ? "99+" : cartCount}
                            </span>
                        )}
                    </div>
                    <span className={cn("text-[10px] font-bold tracking-tight", pathname === "/cart" ? "text-[#1D61E7]" : "text-stone-500")}>
                        {t("nav.cart")}
                    </span>
                    {pathname === "/cart" && (
                        <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#1D61E7] rounded-full shadow-xs" />
                    )}
                </Link>
            </nav>
        </div>
    )
}
