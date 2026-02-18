"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const doLogout = async () => {
      const supabase = createClient()
      try {
        await supabase.auth.signOut()
        try {
          const { clientApiPost } = await import("@/lib/api-client")
          await clientApiPost("auth/logout")
        } catch (apiError) {
          console.error("Backend logout error:", apiError)
        }
      } catch (err) {
        console.error("Logout error:", err)
      } finally {
        router.replace("/")
      }
    }

    void doLogout()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>Signing you out…</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Please wait a moment while we securely end your session.
          </p>
          <Button disabled className="w-full">
            Logging out…
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

