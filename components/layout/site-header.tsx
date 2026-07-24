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
  user: any
  profile?: any
  kycStatus?: string
}

export default function SiteHeader({ user, profile, kycStatus }: SiteHeaderProps) {
  const { t } = useLanguage()
  const [authUser, setAuthUser] = useState<any>(user)
  const [authProfile, setAuthProfile] = useState<any>(profile)
  const [authKyc, setAuthKyc] = useState<string | null>(kycStatus || null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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
      "sticky top-0 z-[100] will-change-transform transform-gpu w-full h-[108px] bg-white border-b border-stone-200/50 lg:border-none lg:bg-transparent",
      scrolled
        ? "lg:bg-white/80 lg:backdrop-blur-2xl lg:border-b lg:border-stone-200/50 lg:shadow-xl lg:shadow-stone-200/20 lg:h-[72px]"
        : "lg:bg-transparent lg:border-b lg:border-transparent lg:h-[96px]"
    )}>
      <div className={cn(
        "container mx-auto px-4 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-0 lg:gap-4 h-full transition-all duration-500"
      )}>
        {/* Row 1: Logo, nav, actions */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-2 md:gap-4 h-16 lg:py-0 lg:flex-1 lg:h-full">

        {/* Mobile Hamburger Menu - First on Left */}
        <div className="lg:hidden flex-shrink-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-900">
                <Menu className="h-5 w-5" />
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

        {/* Logo & Brand Identity */}
        <Link href="/" className="group flex items-center gap-3 md:gap-4 flex-shrink-0 transition-transform active:scale-95">
          <div className="relative h-12 w-12 md:h-16 md:w-16 rounded-[1.25rem] overflow-hidden shadow-2xl shadow-primary/20 ring-4 ring-white group-hover:rotate-6 transition-transform duration-500">
            <Image src="/logo-new.png" alt="TOLA" fill className="object-cover" priority />
          </div>
          <div className="hidden sm:flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-stone-900 leading-none">TOLA.</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1">Your Trade Partner</p>
          </div>
        </Link>

        {/* Search Architecture - Elite Footprint */}
        <div className="hidden lg:flex flex-1 max-w-2xl mx-4 animate-in fade-in slide-in-from-top-2 duration-700 delay-100">
          <ProductSearch />
        </div>

        {/* Navigation & User Hub */}
        <nav className="flex items-center gap-2 md:gap-4">

          <div className="hidden xl:flex items-center gap-4 mr-2">
            <Link href="/shop" className={cn(
              "text-sm font-black uppercase tracking-widest transition-all hover:text-primary relative group",
              pathname === "/shop" ? "text-primary" : "text-stone-500"
            )}>
              {t("nav.shop")}
              <span className={cn(
                "absolute -bottom-2 left-0 h-1 bg-primary transition-all duration-500 rounded-full",
                pathname === "/shop" ? "w-full" : "w-0 group-hover:w-full"
              )} />
            </Link>
            <Link href="/track" className={cn(
              "text-sm font-black uppercase tracking-widest transition-all hover:text-primary relative group",
              pathname?.startsWith("/track") ? "text-primary" : "text-stone-500"
            )}>
              {t("nav.track")}
              <span className={cn(
                "absolute -bottom-2 left-0 h-1 bg-primary transition-all duration-500 rounded-full",
                pathname?.startsWith("/track") ? "w-full" : "w-0 group-hover:w-full"
              )} />
            </Link>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {authUser ? (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden lg:flex items-center gap-1.5 border-r border-stone-200 pr-2 mr-1">
                  <Link href="/favorites" className="relative">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-stone-500 hover:text-amber-500 hover:bg-amber-50">
                      <Heart className="h-5 w-5" />
                      {favorites.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-amber-500 text-white border-2 border-white rounded-full text-[10px] font-bold shadow-sm">
                          {favorites.length}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <CartPopover />
                </div>

                <NotificationPopover userType={authProfile?.user_type} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative group p-1 transition-transform active:scale-95 outline-none">
                      <div className="relative h-11 w-11 md:h-12 md:w-12 rounded-[1.25rem] overflow-hidden p-0.5 bg-gradient-to-tr from-primary to-stone-900">
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
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary text-white rounded-lg flex items-center justify-center border-2 border-white shadow-lg shadow-primary/40 animate-in zoom-in duration-500">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 mt-4 p-2 rounded-[2rem] border-stone-100 shadow-2xl z-[150] animate-in fade-in slide-in-from-top-2 duration-500" align="end">
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

                      {/* Dashboard links for all approved roles */}
                      {(() => {
                        const vendorApproved = authProfile?.vendor?.kyc_status === "approved" || authProfile?.user_type === "vendor";
                        const transporterApproved = authProfile?.transporter?.kyc_status === "approved" || authProfile?.user_type === "transporter";
                        const isAdmin = authProfile?.user_type === "admin";
                        const isAgent = authProfile?.user_type === "agent";
                        const showSection = vendorApproved || transporterApproved || isAdmin || isAgent;
                        if (!showSection) return null;
                        return (
                          <div className="mt-2 pt-2 border-t border-stone-50 space-y-1">
                            {vendorApproved && (
                              <DropdownMenuItem asChild className="rounded-xl h-12 cursor-pointer bg-stone-950 text-white focus:bg-stone-800 focus:text-white">
                                <Link href="/vendor/dashboard" className="flex justify-between items-center w-full px-4">
                                  <div className="flex items-center gap-3">
                                    <Settings className="h-4 w-4 text-primary" />
                                    <span className="font-black text-xs uppercase tracking-widest">{t("nav.seller_dashboard")}</span>
                                  </div>
                                  <ArrowRight className="h-4 w-4 opacity-50" />
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {transporterApproved && (
                              <DropdownMenuItem asChild className="rounded-xl h-12 cursor-pointer bg-emerald-900 text-white focus:bg-emerald-800 focus:text-white">
                                <Link href="/transporter/dashboard" className="flex justify-between items-center w-full px-4">
                                  <div className="flex items-center gap-3">
                                    <Truck className="h-4 w-4 text-emerald-300" />
                                    <span className="font-black text-xs uppercase tracking-widest">{t("nav.transporter")}</span>
                                  </div>
                                  <ArrowRight className="h-4 w-4 opacity-50" />
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <DropdownMenuItem asChild className="rounded-xl h-12 cursor-pointer bg-stone-950 text-white focus:bg-stone-800 focus:text-white">
                                <Link href="/admin" className="flex justify-between items-center w-full px-4">
                                  <div className="flex items-center gap-3">
                                    <Settings className="h-4 w-4 text-primary" />
                                    <span className="font-black text-xs uppercase tracking-widest">{t("nav.admin_dashboard")}</span>
                                  </div>
                                  <ArrowRight className="h-4 w-4 opacity-50" />
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {isAgent && (
                              <DropdownMenuItem asChild className="rounded-xl h-12 cursor-pointer bg-stone-950 text-white focus:bg-stone-800 focus:text-white">
                                <Link href="/agent" className="flex justify-between items-center w-full px-4">
                                  <div className="flex items-center gap-3">
                                    <Settings className="h-4 w-4 text-primary" />
                                    <span className="font-black text-xs uppercase tracking-widest">{t("nav.agent_dashboard")}</span>
                                  </div>
                                  <ArrowRight className="h-4 w-4 opacity-50" />
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </div>
                        );
                      })()}
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
              <div className="flex items-center gap-2 md:gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="hidden lg:flex items-center gap-2 border-r border-stone-200 pr-4 mr-2">
                  <Link href="/favorites" className="relative">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-stone-500 hover:text-amber-500 hover:bg-amber-50">
                      <Heart className="h-5 w-5" />
                      {favorites.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-amber-500 text-white border-2 border-white rounded-full text-[10px] font-bold shadow-sm">
                          {favorites.length}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <CartPopover />
                </div>

                 {/* Mobile: Shop button + combined Login/Sign Up */}
                <Link href="/shop" className="lg:hidden">
                  <Button variant="ghost" className="h-9 rounded-full px-3.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 flex items-center gap-1.5 transition-all">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-extrabold">{t("nav.shop")}</span>
                  </Button>
                </Link>
                <Link href="/auth/login" className="lg:hidden">
                  <Button className="h-9 rounded-full px-4 text-[11px] font-extrabold uppercase tracking-wider shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5">
                    {t("auth.login_signup")}
                  </Button>
                </Link>

                {/* Desktop: separate Login and Sign Up */}
                <Link href="/auth/login" className="hidden lg:inline-flex">
                  <Button variant="ghost" className="font-black text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-primary bg-transparent">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/auth/sign-up" className="hidden lg:inline-flex">
                  <Button className="font-black text-xs uppercase tracking-[0.2em] rounded-2xl md:px-8 h-12 shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                    {t("nav.signup")}
                  </Button>
                </Link>
              </div>
            )}


          </div>
        </nav>
        </div>

        {/* Row 2: Track Order + Search (Mobile Only) */}
        <div className="lg:hidden flex items-center gap-2.5 w-full h-11 pb-2">
          <Link href="/track" className="flex-shrink-0">
            <Button className="bg-primary hover:bg-primary/90 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-full px-3.5 h-9 shadow-md shadow-primary/25 flex items-center gap-1.5 transition-all hover:-translate-y-0.5">
              <MapPin className="h-3.5 w-3.5" />
              {t("nav.track")}
            </Button>
          </Link>
          <div className="flex-1">
            <ProductSearch />
          </div>
        </div>
      </div>
    </header>
  )
}
