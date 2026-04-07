import SiteHeader from "@/components/layout/site-header"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Account Deletion Request | TOLA Tanzania",
  description:
    "Request deletion of your TOLA account and associated personal data. Use in-app self-service or contact the privacy team.",
  alternates: {
    canonical: "https://tolatola.co/account-deletion-request",
  },
}

export default async function AccountDeletionRequestPage() {
  const supabase = (await createClient()) as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let kycStatus = null

  if (user) {
    const { data: profileData } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()
    profile = profileData
    kycStatus = profileData?.kyc_status || null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-12 md:py-20 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900">
            Account Deletion Request
          </h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            You can request permanent deletion of your account and associated personal data using the options below.
          </p>

          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-stone-900">Option 1: Self-service in your profile</h2>
              <p className="mt-2 text-muted-foreground">
                Sign in, open your profile settings, and use <strong>Delete Account</strong> in the Danger Zone.
              </p>
              <a
                href="/profile"
                className="inline-flex mt-4 items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
              >
                Go to Profile
              </a>
            </div>

            <div className="border-t border-stone-100 pt-6">
              <h2 className="text-lg md:text-xl font-bold text-stone-900">Option 2: Email request</h2>
              <p className="mt-2 text-muted-foreground">
                If you cannot access your account, email our privacy team and include the phone number or email tied to the account.
              </p>
              <a
                href="mailto:privacy@tolatola.co?subject=Account%20Deletion%20Request"
                className="inline-flex mt-4 items-center rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-bold text-stone-800 hover:bg-stone-50"
              >
                privacy@tolatola.co
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Note: account deletion is permanent and cannot be undone once processed.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
