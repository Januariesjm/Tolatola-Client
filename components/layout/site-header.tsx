"use client"

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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, User, Package, Settings, LogOut, CheckCircle2, Menu, Home, Store } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { HeaderAnimatedText } from "./header-animated-text"
import { ProductSearch } from "./product-search"
import { CartPopover } from "./cart-popover"
import { useEffect, useState } from "react"
import { LanguageSwitcher } from "./language-switcher"
import { NotificationPopover } from "./notification-popover"
import { clientApiGet } from "@/lib/api-client"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/types"

interface SiteHeaderProps {
  user: any
  profile?: any
  kycStatus?: string
}

export default function SiteHeader({ user, profile, kycStatus }: SiteHeaderProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authUser, setAuthUser] = useState(user)
  const [authProfile, setAuthProfile] = useState(profile)
  const [authKyc, setAuthKyc] = useState(kycStatus)
  const [mounted, setMounted] = useState(false)

  const handleLogout = async () => {
    try {
      // Clear Supabase session on client side first
      const supabase = createClientComponentClient<Database>()
      await supabase.auth.signOut()

      // Also call backend logout (optional, but good for consistency)
      try {
        const { clientApiPost } = await import("@/lib/api-client")
        await clientApiPost("auth/logout")
      } catch (apiError) {
        // Backend logout failed, but we've already cleared local session
        console.error("Backend logout error:", apiError)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Force redirect to home page
      window.location.href = "/"
    }
  }

  // Client-side session check to update header after login
  useEffect(() => {
    setMounted(true)
    const supabase = createClientComponentClient<Database>()
    const loadSession = async () => {
      // Use getUser() to verify authentication with server
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser()
      setAuthUser(sessionUser ?? null)
      if (sessionUser) {
        try {
          const res = await clientApiGet<{ profile: any }>("profile")
          setAuthProfile(res.profile)
          setAuthKyc(res.profile?.kyc_status || null)
        } catch {
          // ignore
        }
      } else {
        setAuthProfile(null)
        setAuthKyc(null)
      }
    }
    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setAuthUser(sessionUser)
      if (sessionUser) {
        clientApiGet<{ profile: any }>("profile")
          .then((res) => {
            setAuthProfile(res.profile)
            setAuthKyc(res.profile?.kyc_status || null)
          })
          .catch(() => {
            setAuthProfile(null)
            setAuthKyc(null)
          })
      } else {
        setAuthProfile(null)
        setAuthKyc(null)
      }
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  if (!mounted) return null

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLoginRedirect = () => {
    // After login, users should land on shop
    router.push("/auth/login?next=/shop")
  }

  const isVerified = (authKyc || kycStatus) === "approved"

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4">
        <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
          <Image src="/tolalogo.jpg" alt="TOLA" width={150} height={45} className="h-16 md:h-16 lg:h-20 w-auto" />
          <div className="hidden lg:block">
            <HeaderAnimatedText />
          </div>
          <div className="block lg:hidden">
            <HeaderAnimatedText />
          </div>
        </Link>

        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <LanguageSwitcher />
          <ProductSearch />
        </div>

        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          <LanguageSwitcher />
          <Link href="/shop">
            <Button variant="ghost" className="text-sm lg:text-base">
              Browse Products
            </Button>
          </Link>

          {authUser ? (
            <>
              <NotificationPopover />
              <CartPopover />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative h-10 w-10 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={authProfile?.profile_image_url || ""} alt={authProfile?.full_name || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(authProfile?.full_name || authProfile?.email || "User")}
                      </AvatarFallback>
                    </Avatar>
                    {isVerified && (
                      <CheckCircle2 className="absolute -bottom-1 -right-1 h-5 w-5 text-primary bg-background rounded-full border-2 border-background" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 z-[100]" align="end" forceMount sideOffset={8}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none flex items-center gap-2">
                        {authProfile?.full_name || "User"}
                        {isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{authProfile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer w-full">
                      <Package className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" className="cursor-pointer w-full">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Favorites</span>
                    </Link>
                  </DropdownMenuItem>
                  {authProfile?.user_type === "vendor" && (
                    <DropdownMenuItem asChild>
                      <Link href="/vendor/dashboard" className="cursor-pointer w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Vendor Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {authProfile?.user_type === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" className="text-sm lg:text-base bg-transparent" onClick={handleLoginRedirect}>
                Login
              </Button>
              <Link href="/auth/sign-up">
                <Button className="text-sm lg:text-base">Sign Up</Button>
              </Link>
            </>
          )}
        </nav>

        <div className="flex md:hidden items-center gap-2">
          {authUser && <CartPopover />}
          <LanguageSwitcher />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Navigate through TOLA</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-4 mt-8">
                <div className="w-full">
                  <ProductSearch />
                </div>

                {authUser && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={authProfile?.profile_image_url || ""} alt={authProfile?.full_name || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(authProfile?.full_name || authProfile?.email || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium flex items-center gap-2">
                        {authProfile?.full_name || "User"}
                        {isVerified && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </p>
                      <p className="text-xs text-muted-foreground">{authProfile?.email}</p>
                    </div>
                  </div>
                )}

                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </Link>

                <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Store className="mr-2 h-4 w-4" />
                    Browse Products
                  </Button>
                </Link>

                {user ? (
                  <>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </Link>

                    <Link href="/orders" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Package className="mr-2 h-4 w-4" />
                        My Orders
                      </Button>
                    </Link>

                    <Link href="/favorites" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Favorites
                      </Button>
                    </Link>

                    {profile?.user_type === "vendor" && (
                      <Link href="/vendor/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Settings className="mr-2 h-4 w-4" />
                          Vendor Dashboard
                        </Button>
                      </Link>
                    )}

                    {profile?.user_type === "admin" && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}

                    <div className="border-t pt-4 mt-4">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          handleLogout()
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full bg-transparent">
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
