import { getServerSupabase } from "./supabase/server"

export async function getSessionProfile() {
  const supabase = getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
  return { user, profile }
}

export async function requireRole(roles: Array<"admin" | "coordinator" | "faculty" | "student">) {
  const { user, profile } = await getSessionProfile()
  if (!user || !profile || !roles.includes(profile.role)) {
    return { authorized: false as const }
  }
  return { authorized: true as const, user, profile }
}
