export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import type { Template } from "@/lib/types"

const mem = globalThis as unknown as {
  __templates?: Template[]
}

mem.__templates ||= []

export async function GET() {
  return NextResponse.json(mem.__templates, {
    headers: { "Cache-Control": "no-store" },
  })
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Template
  const t: Template = { ...body, id: body.id || crypto.randomUUID(), createdAt: new Date().toISOString() }
  mem.__templates!.push(t)
  return NextResponse.json({ id: t.id })
}
