"use client"

import { api } from "./api"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "./types"

/** Call API without auth (e.g. tracking request-otp, verify-otp) */
export async function clientApiPostPublic<T>(path: string, body?: unknown): Promise<T> {
  return api.post<T>(path, body, undefined)
}

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

/** Returns full response for profile update so caller can handle 400/401. Does not throw. */
export async function clientApiPatchProfile(body: { full_name?: string; phone?: string }): Promise<{
  ok: boolean
  status: number
  data: { success?: boolean; profile?: any; error?: string; readOnlyFields?: string[] }
}> {
  const token = await getToken()
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "")
  const path = "profile"
  const url = `${baseUrl}/${path.replace(/^\//, "")}`
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data: data as any }
}

/** Returns full response for avatar upload so caller can handle 400/401. Does not throw. */
export async function clientApiPostProfileAvatar(image: string): Promise<{
  ok: boolean
  status: number
  data: { success?: boolean; profile?: any; profile_image_url?: string; error?: string }
}> {
  const token = await getToken()
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "")
  const url = `${baseUrl}/profile/avatar`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ image }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data: data as any }
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


