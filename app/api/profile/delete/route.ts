import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { serverApiPost } from "@/lib/api-server"

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

        // 2. Delegate the user deletion and database cleanup to the backend API
        const response = await serverApiPost<{ success: boolean; message?: string }>("profile/delete")

        return NextResponse.json(response)
    } catch (error: any) {
        console.error("Error deleting account:", error)
        return NextResponse.json(
            { error: error?.message || "Failed to delete account" },
            { status: 500 }
        )
    }
}
