"use client"

import { api } from "./api"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "./types"

export async function clientApiGet<T>(path: string) {
  const token = await getToken()
  return api.get<T>(path, token || undefined)
}

export async function clientApiPost<T>(path: string, body?: any) {
  const token = await getToken()
  return api.post<T>(path, body, token || undefined)
}

export async function clientApiPatch<T>(path: string, body?: any) {
  const token = await getToken()
  return api.patch<T>(path, body, token || undefined)
}

export async function clientApiPut<T>(path: string, body?: any) {
  const token = await getToken()
  return api.put<T>(path, body, token || undefined)
}

export async function clientApiDelete<T>(path: string) {
  const token = await getToken()
  return api.delete<T>(path, token || undefined)
}

async function getToken() {
  const supabase = createClientComponentClient<Database>()
  // Verify user is authenticated with server
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


