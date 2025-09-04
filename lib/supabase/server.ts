import { cookies, headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"

let _server: ReturnType<typeof createServerClient> | null = null

export function getServerSupabase() {
  if (_server) return _server

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }

  _server = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookies().set({ name, value, ...options })
        } catch {}
      },
      remove(name: string, options: any) {
        try {
          cookies().set({ name, value: "", ...options, maxAge: 0 })
        } catch {}
      },
    },
    headers: {
      get(name: string) {
        return headers().get(name) ?? undefined
      },
    },
  })
  return _server
}
