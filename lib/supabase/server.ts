import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies, headers } from "next/headers"
import type { Database } from "../types"

export async function createClient() {
  return createServerComponentClient<Database>({ cookies })
}

export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
