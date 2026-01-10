"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    Heart,
    ShoppingCart,
    Grid3x3,
    ChevronRight
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

export function MobileBottomNav() {
    const pathname = usePathname()
    const [categories, setCategories] = useState<any[]>([])
    const [cartCount, setCartCount] = useState(0)
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

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

    const navItems = [
        { label: "Home", icon: Home, href: "/" },
        { label: "Favorites", icon: Heart, href: "/favorites" },
        { label: "Cart", icon: ShoppingCart, href: "/cart", badge: cartCount },
    ]

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
            <nav className="bg-[#006666] backdrop-blur-lg border border-white/10 shadow-2xl rounded-3xl h-16 flex items-center justify-around relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-none" />

                {/* Categories Menu (Hamburger) */}
                <Sheet open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
                    <SheetTrigger asChild>
                        <button className="flex flex-col items-center justify-center gap-1 w-full h-full text-white/70 hover:text-white transition-colors relative z-10">
                            <Grid3x3 className="h-5 w-5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Categories</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[70vh] rounded-t-[2.5rem] border-none p-0 bg-white">
                        <SheetHeader className="p-6 border-b border-stone-100">
                            <SheetTitle className="text-xl font-black tracking-tight text-stone-900">Explore Categories</SheetTitle>
                        </SheetHeader>
                        <div className="overflow-y-auto h-full pb-20 p-4">
                            <div className="grid gap-2">
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/shop?category=${cat.slug}`}
                                        onClick={() => setIsCategoriesOpen(false)}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            {cat.image_url && (
                                                <div className="h-10 w-10 rounded-xl overflow-hidden relative border border-stone-200">
                                                    <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                                                </div>
                                            )}
                                            <span className="font-bold text-stone-900">{cat.name}</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-primary transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative z-10",
                                isActive ? "text-white" : "text-white/60 hover:text-white"
                            )}
                        >
                            <div className="relative">
                                <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                                {item.badge > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-[#006666]">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                            {isActive && (
                                <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
