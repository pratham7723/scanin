import { type NextRequest, NextResponse } from "next/server"
import type { AttendanceEvent, AttendanceRuleCheck } from "@/lib/types"

const mem = globalThis as unknown as {
  __attendance?: AttendanceEvent[]
}

mem.__attendance ||= []

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export async function GET() {
  // Return last 200 events
  const items = mem.__attendance!.slice(-200).reverse()
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AttendanceEvent
  const now = new Date()
  const event: AttendanceEvent = {
    id: crypto.randomUUID(),
    ...body,
    scannedAt: now.toISOString(),
  }
  // Enforce rule: classroom present only if gate scan exists same day
  if (event.type === "classroom") {
    const hasGate = mem.__attendance!.some(
      (ev) => ev.type === "gate" && ev.personId === event.personId && isSameDay(new Date(ev.scannedAt), now),
    )
    if (!hasGate) {
      const res: AttendanceRuleCheck = { allowed: false, reason: "Gate entry not found for today" }
      return NextResponse.json(res, { status: 403 })
    }
  }
  mem.__attendance!.push(event)
  const res: AttendanceRuleCheck = { allowed: true }
  return NextResponse.json(res)
}
