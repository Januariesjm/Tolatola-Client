"use client"

import Image from "next/image"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationPopover } from "@/components/layout/notification-popover"

interface DashboardHeaderProps {
  roleName: string
  onSignOut: () => void
}

/** Sticky admin header: brand, role, notifications and sign-out. */
export function DashboardHeader({ roleName, onSignOut }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-primary/20 bg-white">
              <Image src="/logo-new.png" alt="TolaTola" fill className="object-contain p-1.5" priority />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-slate-900 uppercase flex items-center">
              TOLA ADMIN
              <span className="ml-4 pl-4 border-l-2 border-slate-200 text-primary">{roleName}</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <NotificationPopover />
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
