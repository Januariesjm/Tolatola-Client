import { cookies, headers } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { api } from "./api"
import type { Database } from "./types"

async function getSessionToken() {
  const supabase = createServerComponentClient<Database>({ cookies, headers })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return undefined
  
  // Get the session to retrieve the access token
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token
}

export async function serverApiGet<T>(path: string) {
  const token = await getSessionToken()
  return api.get<T>(path, token || undefined)
}

export async function serverApiPost<T>(path: string, body?: any) {
  const token = await getSessionToken()
  return api.post<T>(path, body, token || undefined)
}

export async function serverApiPatch<T>(path: string, body?: any) {
  const token = await getSessionToken()
  return api.patch<T>(path, body, token || undefined)
}

export async function serverApiPut<T>(path: string, body?: any) {
  const token = await getSessionToken()
  return api.put<T>(path, body, token || undefined)
}

