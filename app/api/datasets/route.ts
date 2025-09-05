import { type NextRequest, NextResponse } from "next/server"
import type { Dataset } from "@/lib/types"

const mem = globalThis as unknown as {
  __datasets?: Dataset[]
}

mem.__datasets ||= []

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  
  if (id) {
    // Return specific dataset for preview
    const dataset = mem.__datasets!.find(d => d.id === id)
    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }
    return NextResponse.json(dataset)
  }
  
  // Return list of datasets
  const list = mem.__datasets!.map((d) => ({
    id: d.id,
    name: d.name,
    rows: d.rows,
    columns: d.columns,
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

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  
  if (!id) {
    return NextResponse.json({ error: "Dataset ID is required" }, { status: 400 })
  }

  const index = mem.__datasets!.findIndex(d => d.id === id)
  if (index === -1) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
  }

  mem.__datasets!.splice(index, 1)
  return NextResponse.json({ success: true })
}
