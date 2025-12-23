import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "../types"

export function createClient() {
  return createClientComponentClient<Database>()
}
