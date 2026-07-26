"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Home,
  ShoppingBag,
  Sparkles,
  Zap,
  Globe,
  ArrowRight,
  Truck,
  MapPin,
  Search,
  ClipboardList,
  X
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { CartPopover } from "./cart-popover"
import { LanguageSwitcher } from "./language-switcher"
import { ProductSearch } from "./product-search"
import { NotificationPopover } from "./notification-popover"
import { clientApiGet } from "@/lib/api-client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useFavorites } from "@/hooks/use-favorites"
import { useLanguage } from "@/lib/i18n/language-context"

interface SiteHeaderProps {
  user?: any
  profile?: any
  kycStatus?: string | null
}

export default function SiteHeader({ user, profile, kycStatus }: SiteHeaderProps) {
  const { t } = useLanguage()
  const [authUser, setAuthUser] = useState<any>(user)
  const [authProfile, setAuthProfile] = useState<any>(profile)
  const [authKyc, setAuthKyc] = useState<string | null>(kycStatus || null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient<Database>()
  const { favorites } = useFavorites()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("cart")
    window.dispatchEvent(new Event("cartUpdated"))
    router.refresh()
    router.push("/")
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Track cart count for mobile header badges
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      const count = cart.reduce((acc: number, item: any) => acc + item.quantity, 0)
      setCartCount(count)
    }
    updateCartCount()
    window.addEventListener("cartUpdated", updateCartCount)
    window.addEventListener("storage", updateCartCount)
    return () => {
      window.removeEventListener("cartUpdated", updateCartCount)
      window.removeEventListener("storage", updateCartCount)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      const loadSession = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setAuthUser(session.user)
          try {
            const res = await clientApiGet<{ profile: any }>("profile")
            setAuthProfile(res.profile)
            setAuthKyc(res.profile?.kyc_status || null)
          } catch (err) {
            console.error("[v0] Header profile load error:", err)
          }
        }
      }
      loadSession()
    } else {
      setAuthUser(user)
      setAuthProfile(profile)
      setAuthKyc(kycStatus || null)
    }
  }, [user, profile, kycStatus, supabase])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const isVerified = (authKyc || kycStatus) === "approved"
  const isHome = pathname === "/"

  return (
    <header className={cn(
      "sticky top-0 z-[100] will-change-transform transform-gpu w-full h-[116px] bg-white border-b border-stone-200/50 lg:border-none lg:bg-transparent",
      scrolled
        ? "lg:bg-white/80 lg:backdrop-blur-2xl lg:border-b lg:border-stone-200/50 lg:shadow-xl lg:shadow-stone-200/20 lg:h-[72px]"
        : "lg:bg-transparent lg:border-b lg:border-transparent lg:h-[96px]"
    )}>
      <div className={cn(
        "container mx-auto px-4 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-0 lg:gap-4 h-full transition-all duration-500"
      )}>
        {/* Row 1: Logo, nav, actions */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-2 md:gap-4 h-16 lg:py-0 lg:flex-1 lg:h-full">

        {/* Mobile Header Row (100% Equal Spacing between all 7 items) */}
        <div className="flex lg:hidden items-center justify-between w-full gap-1 sm:gap-1.5 md:gap-2 h-full px-0.5">
          {/* 1. Hamburger Menu */}
          <div className="flex-shrink-0">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-900 p-0">
                  <Menu className="h-4.5 w-4.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" hideCloseButton className="w-full sm:w-[400px] border-none p-0 bg-white z-[200]">
                <div className="flex flex-col h-full">
                  <SheetHeader className="p-6 text-left bg-stone-950 text-white relative">
                    <SheetClose asChild>
                      <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-50">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close menu</span>
                      </button>
                    </SheetClose>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-2xl overflow-hidden ring-4 ring-white/10 shadow-2xl">
                        <Image src="/logo-new.png" alt="Tola" width={48} height={48} className="object-cover" />
                      </div>
                      <div>
                        <SheetTitle className="text-2xl font-black tracking-tighter text-white">{t("nav.menu")}</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t("nav.navigation")}</p>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Mobile Language Switcher Row */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-150 flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-700">Language / Lugha</span>
                      <LanguageSwitcher />
                    </div>

                    <nav className="grid gap-3">
                      {[
                        { href: "/", label: t("nav.home"), icon: Home },
                        { href: "/shop", label: t("nav.shop"), icon: ShoppingBag },
                        { href: "/track", label: t("nav.track"), icon: Truck },
                        { href: "/validation", label: t("nav.survey"), icon: ClipboardList },
                        { href: "/profile", label: t("nav.profile"), icon: User },
                        { href: "/orders", label: t("nav.orders"), icon: Package },
                        { href: "/favorites", label: t("nav.favorites"), icon: Sparkles }
                      ].map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                          <div className="flex items-center justify-between p-5 rounded-2xl bg-stone-50 hover:bg-stone-900 hover:text-white transition-all group">
                            <div className="flex items-center gap-4">
                              <item.icon className="h-5 w-5 text-primary group-hover:text-primary transition-colors" />
                              <span className="text-lg font-bold tracking-tight">{item.label}</span>
                            </div>
                            <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                          </div>
                        </Link>
                      ))}
                    </nav>

                    {authUser ? (
                      <div className="pt-6 border-t border-stone-100 flex flex-col gap-3">
                        <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-stone-200">
                          <ShieldCheck className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-bold text-stone-900">{t("nav.verified_account")}</p>
                            <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{t("nav.secure")}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="h-14 rounded-2xl text-destructive font-bold text-sm hover:bg-destructive/5"
                          onClick={() => {
                            setMobileMenuOpen(false)
                            handleLogout()
                          }}
                        >
                          <LogOut className="mr-3 h-5 w-5" />
                          {t("nav.logout")}
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-6 border-t border-stone-100">
                        <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full h-14 rounded-2xl font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-primary/20">
                            {t("auth.login_signup")}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* 2. TOLA Logo Image */}
          <Link href="/" className="flex-shrink-0 transition-transform active:scale-95">
            <div className="relative h-8.5 w-8.5 rounded-xl overflow-hidden shadow-xs border border-stone-200/80 bg-white p-0.5 flex-shrink-0">
              <div className="relative h-full w-full rounded-[0.4rem] overflow-hidden">
                <Image src="/logo-new.png" alt="TOLA" fill className="object-cover" priority />
              </div>
            </div>
          </Link>

          {/* 3. Word TOLA. */}
          <Link href="/" className="flex-shrink-0 transition-transform active:scale-95">
            <span className="text-base font-black tracking-tighter text-stone-900 leading-none">TOLA.</span>
          </Link>

          {/* 4. Shop Button */}
          <Link href="/shop" className="flex-shrink-0">
            <div className="h-8.5 px-2.5 sm:px-3 rounded-full bg-[#EEF4FF] border border-[#D0E1FD] hover:bg-[#E2ECFF] active:scale-95 transition-all flex items-center gap-1 shadow-xs">
              <ShoppingBag className="h-3.5 w-3.5 text-[#1D61E7]" />
              <span className="text-[11px] sm:text-xs font-bold text-[#1D61E7] tracking-tight">{t("nav.shop")}</span>
            </div>
          </Link>

          {/* 5. Love (Favorites) Icon */}
          <Link href="/favorites" className="relative flex-shrink-0">
            <div className="h-8.5 w-8.5 rounded-full bg-white border border-stone-200/90 shadow-xs hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center">
              <Heart className="h-4 w-4 text-[#1D61E7] stroke-[2.2]" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E53E3E] text-white text-[8px] font-extrabold h-3.5 min-w-[14px] px-0.5 rounded-full flex items-center justify-center ring-1.5 ring-white shadow-xs">
                  {favorites.length > 9 ? "9+" : favorites.length}
                </span>
              )}
            </div>
          </Link>

          {/* 6. Cart Icon */}
          <Link href="/cart" className="relative flex-shrink-0">
            <div className="h-8.5 w-8.5 rounded-full bg-white border border-stone-200/90 shadow-xs hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 fill-[#1D61E7] text-[#1D61E7]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E53E3E] text-white text-[8px] font-extrabold h-3.5 min-w-[14px] px-0.5 rounded-full flex items-center justify-center ring-1.5 ring-white shadow-xs">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
          </Link>

          {/* 7. Sign In Button / User Avatar at the end */}
          {authUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative group p-0.5 transition-transform active:scale-95 outline-none flex-shrink-0">
                  <div className="relative h-8.5 w-8.5 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-primary to-stone-900">
                    <Avatar className="h-full w-full rounded-full">
                      <AvatarImage src={authProfile?.profile_image_url || ""} />
                      <AvatarFallback className="bg-stone-50 text-stone-900 font-black text-[10px]">
                        {getInitials(authProfile?.full_name || authProfile?.email || t("nav.profile"))}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 mt-4 p-2 rounded-[2rem] border-stone-100 shadow-2xl z-[150]" align="end">
                <DropdownMenuLabel className="p-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-black text-stone-900 leading-none truncate">
                      {authProfile?.full_name || t("nav.profile")}
                    </p>
                    <p className="text-xs font-bold text-stone-400 italic truncate">{authProfile?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-2 bg-stone-50" />
                <div className="p-1 space-y-1">
                  <DropdownMenuItem asChild className="rounded-xl h-12 cursor-pointer focus:bg-stone-50">
                    <Link href="/profile" className="flex items-center gap-3">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-bold">{t("nav.your_profile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl h-12 cursor-pointer focus:bg-stone-50">
                    <Link href="/orders" className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-bold">{t("nav.order_history")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl h-12 cursor-pointer focus:bg-stone-50">
                    <Link href="/favorites" className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span className="font-bold">{t("nav.wishlist")}</span>
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="mx-2 bg-stone-50" />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl h-12 cursor-pointer text-destructive focus:bg-destructive/5 font-black text-xs uppercase tracking-widest px-4">
                  <LogOut className="h-4 w-4 mr-3" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login" className="flex-shrink-0">
              <Button className="h-8.5 rounded-full px-2.5 sm:px-3 text-[11px] font-extrabold tracking-tight bg-[#1D61E7] hover:bg-[#1854C9] text-white shadow-xs transition-all">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Desktop Header Layout */}
        <div className="hidden lg:flex items-center justify-between w-full gap-4 h-full">
          {/* Logo & Brand Identity */}
          <Link href="/" className="group flex items-center gap-3 flex-shrink-0 transition-transform active:scale-95">
            <div className="relative h-12 w-12 rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 bg-white p-0.5 group-hover:rotate-3 transition-transform duration-500 flex-shrink-0">
              <div className="relative h-full w-full rounded-[0.5rem] overflow-hidden">
                <Image src="/logo-new.png" alt="TOLA" fill className="object-cover" priority />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter text-stone-900 leading-none">TOLA.</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1">Your Trade Partner</p>
            </div>
          </Link>

          {/* Search Architecture */}
          <div className="flex-1 max-w-2xl mx-4">
            <ProductSearch />
          </div>

          {/* Navigation & User Hub */}
          <nav className="flex items-center gap-3">
            {/* Shop & Track Order Pill Buttons */}
            <div className="flex items-center gap-2.5">
              <Link href="/shop" className="flex-shrink-0">
                <div className="h-10 px-4 rounded-full bg-[#EEF4FF] border border-[#D0E1FD] hover:bg-[#E2ECFF] active:scale-95 transition-all flex items-center gap-2 shadow-xs">
                  <ShoppingBag className="h-4 w-4 text-[#1D61E7]" />
                  <span className="text-sm font-bold text-[#1D61E7] tracking-tight">{t("nav.shop")}</span>
                </div>
              </Link>
              <Link href="/track" className="flex-shrink-0">
                <div className="h-10 px-4 rounded-full bg-[#1D61E7] hover:bg-[#1854C9] text-white active:scale-95 transition-all flex items-center gap-2 shadow-xs">
                  <MapPin className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold text-white tracking-tight">{t("nav.track")}</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />

              {/* Favorites Love Icon Circle & Cart Popover */}
              <div className="flex items-center gap-2.5 border-r border-stone-200 pr-3 mr-1">
                <Link href="/favorites" className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-white border border-stone-200/90 shadow-xs hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center">
                    <Heart className="h-5 w-5 text-[#1D61E7] stroke-[2.2]" />
                    {favorites.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#E53E3E] text-white text-[9px] font-extrabold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                        {favorites.length > 9 ? "9+" : favorites.length}
                      </span>
                    )}
                  </div>
                </Link>
                <CartPopover />
              </div>

              {authUser ? (
                <div className="flex items-center gap-3">
                  <NotificationPopover userType={authProfile?.user_type} />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative group p-1 transition-transform active:scale-95 outline-none">
                        <div className="relative h-11 w-11 rounded-[1.25rem] overflow-hidden p-0.5 bg-gradient-to-tr from-primary to-stone-900">
                          <div className="h-full w-full rounded-[1.1rem] overflow-hidden bg-white">
                            <Avatar className="h-full w-full rounded-none">
                              <AvatarImage src={authProfile?.profile_image_url || ""} />
                              <AvatarFallback className="bg-stone-50 text-stone-900 font-black text-xs">
                                {getInitials(authProfile?.full_name || authProfile?.email || t("nav.profile"))}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        {isVerified && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary text-white rounded-lg flex items-center justify-center border-2 border-white shadow-lg shadow-primary/40">
                            <CheckCircle2 className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 mt-4 p-2 rounded-[2rem] border-stone-100 shadow-2xl z-[150]" align="end">
                      <DropdownMenuLabel className="p-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-base font-black text-stone-900 leading-none truncate">
                            {authProfile?.full_name || t("nav.profile")}
                          </p>
                          <p className="text-xs font-bold text-stone-400 italic truncate">{authProfile?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="mx-2 bg-stone-50" />
                      <div className="p-1 space-y-1">
                        <DropdownMenuItem asChild className="rounded-xl h-12 cursor-pointer focus:bg-stone-50">
                          <Link href="/profile" className="flex items-center gap-3">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-bold">{t("nav.your_profile")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl h-12 cursor-pointer focus:bg-stone-50">
                          <Link href="/orders" className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="font-bold">{t("nav.order_history")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl h-12 cursor-pointer focus:bg-stone-50">
                          <Link href="/favorites" className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="font-bold">{t("nav.wishlist")}</span>
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator className="mx-2 bg-stone-50" />
                      <DropdownMenuItem onClick={handleLogout} className="rounded-xl h-12 cursor-pointer text-destructive focus:bg-destructive/5 font-black text-xs uppercase tracking-widest px-4">
                        <LogOut className="h-4 w-4 mr-3" />
                        {t("nav.logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/auth/login">
                    <Button variant="ghost" className="font-black text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-primary bg-transparent">
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button className="font-black text-xs uppercase tracking-[0.2em] rounded-2xl md:px-8 h-12 shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                      {t("nav.signup")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
        </div>

        {/* Row 2: Track Order + Search (Mobile Only - Android App style) */}
        <div className="lg:hidden flex items-center gap-2 w-full h-11 pb-2 pt-1">
          <Link href="/track" className="flex-shrink-0">
            <Button className="bg-[#1D61E7] hover:bg-[#1854C9] text-white font-bold text-xs tracking-tight rounded-full px-3.5 h-9.5 shadow-xs flex items-center gap-1.5 transition-all">
              <MapPin className="h-4 w-4 text-white" />
              {t("nav.track")}
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <ProductSearch />
          </div>
        </div>
      </div>
    </header>
  )
}
