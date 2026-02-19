export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

async function request<T>(
  path: string,
  options: {
    method?: HttpMethod
    body?: any
    headers?: Record<string, string>
    accessToken?: string
    nextOptions?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } }
  } = {},
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
  const url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`
  }

  const useNextCache = options.nextOptions?.next != null
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    ...(useNextCache ? { next: options.nextOptions!.next } : { cache: "no-store" as RequestCache }),
    ...(options.nextOptions && !useNextCache ? options.nextOptions : {}),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    const errorMessage = `API ${res.status}: ${errorBody}`
    console.error("[API Error]", {
      url,
      method: options.method || "GET",
      status: res.status,
      error: errorBody,
    })
    throw new Error(errorMessage)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string, accessToken?: string, nextOptions?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } }) =>
    request<T>(path, { method: "GET", accessToken, nextOptions }),
  post: <T>(path: string, body?: any, accessToken?: string) =>
    request<T>(path, { method: "POST", body, accessToken }),
  patch: <T>(path: string, body?: any, accessToken?: string) =>
    request<T>(path, { method: "PATCH", body, accessToken }),
  put: <T>(path: string, body?: any, accessToken?: string) => request<T>(path, { method: "PUT", body, accessToken }),
  delete: <T>(path: string, accessToken?: string) => request<T>(path, { method: "DELETE", accessToken }),
}

