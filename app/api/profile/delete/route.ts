import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
    try {
        // 1. Verify the user is authenticated using the server client
        const supabaseServer = await createServerClient()
        const {
            data: { user },
        } = await supabaseServer.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Use the Service Role Key to delete the user from Supabase Auth
        // We need the service role key to delete users.
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Fallback (likely wont work for delete)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        )

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
            user.id
        )

        if (deleteError) {
            console.error("Error deleting user from Auth:", deleteError)
            throw deleteError
        }

        // 3. Optional: Clean up public.users data if not handled by ON DELETE CASCADE
        // Trigger should handle this, or we trust CASCADE.

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting account:", error)
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }
}
