import { createBrowserClient } from "@supabase/ssr"

let _client: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserSupabase() {
  if (_client) return _client

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null as any
  }

  _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return _client
}
