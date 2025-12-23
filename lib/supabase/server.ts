import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import type { Database } from "../types"

export async function createClient() {
  return createServerComponentClient<Database>({ cookies, headers })
}
