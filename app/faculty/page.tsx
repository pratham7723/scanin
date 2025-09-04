import { requireRole } from "@/lib/auth"
import { getServerSupabase } from "@/lib/supabase/server"

export default async function FacultyPage() {
  const gate = await requireRole(["faculty"])
  if (!gate.authorized) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Faculty</h1>
        <p className="text-muted-foreground">Sign in as a Faculty user to view your classes.</p>
      </main>
    )
  }

  const supabase = getServerSupabase()

  // handle missing Supabase configuration gracefully
  if (!supabase) {
    return (
      <main className="p-6 space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">Faculty</h1>
          <p className="text-sm text-muted-foreground">
            Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL
            and SUPABASE_ANON_KEY) to enable data.
          </p>
        </header>
      </main>
    )
  }

  let assigned: any[] = []
  let lectures: any[] = []
  try {
    const res = await supabase
      .from("class_faculty")
      .select("class_id, classes(name, department, batch)")
      .eq("faculty_id", gate.profile!.id)
    assigned = res.data || []
    const classIds = assigned.map((a) => a.class_id)
    if (classIds.length) {
      const lr = await supabase
        .from("lectures")
        .select("*")
        .in("class_id", classIds)
        .order("scheduled_at", { ascending: true })
      lectures = lr.data || []
    }
  } catch {}

  return (
    <main className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Faculty</h1>
        <p className="text-sm text-muted-foreground">Assigned classes and upcoming lectures</p>
      </header>

      <section className="space-y-2">
        <h2 className="font-medium">Assigned Classes</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {assigned.map((a) => (
            <div key={a.class_id} className="border rounded p-3">
              <div className="font-medium">{a.classes?.name}</div>
              <div className="text-xs text-muted-foreground">
                {a.classes?.department} · {a.classes?.batch}
              </div>
            </div>
          ))}
          {!assigned.length && <p className="text-sm text-muted-foreground">No classes assigned yet.</p>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Upcoming Lectures</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {lectures.map((lec: any) => (
            <div key={lec.id} className="border rounded p-3">
              <div className="font-medium">{lec.title}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(lec.scheduled_at).toLocaleString()} · {lec.duration_min} min
              </div>
            </div>
          ))}
          {!lectures.length && <p className="text-sm text-muted-foreground">No lectures scheduled.</p>}
        </div>
      </section>
    </main>
  )
}
