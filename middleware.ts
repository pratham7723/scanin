import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/designer") || pathname.startsWith("/idcard-designer")) {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  // safely create Supabase client only when env vars exist; otherwise skip
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  // if missing config, skip Supabase bootstrapping to avoid runtime error
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        res.cookies.set({ name, value: "", ...options, maxAge: 0 })
      },
    },
  })

  try {
    await supabase.auth.getUser()
  } catch {
    // handle error if needed
  }

  return res
}

// Optionally protect routes later via matcher if needed
export const config = {
  matcher: ["/admin/:path*", "/faculty/:path*", "/analytics/:path*"],
}
