import { type NextRequest, NextResponse } from "next/server"
import type { Dataset } from "@/lib/types"

const mem = globalThis as unknown as {
  __datasets?: Dataset[]
}

mem.__datasets ||= []

export async function GET() {
  const list = mem.__datasets!.map((d) => ({
    id: d.id,
    name: d.name,
    rows: d.rows.length,
    columns: d.columns.length,
    createdAt: d.createdAt,
  }))
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Omit<Dataset, "id" | "createdAt">
  const d: Dataset = {
    id: crypto.randomUUID(),
    name: body.name,
    columns: body.columns,
    rows: body.rows,
    createdAt: new Date().toISOString(),
  }
  mem.__datasets!.push(d)
  return NextResponse.json({ id: d.id })
}
