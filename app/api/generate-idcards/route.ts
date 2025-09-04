import type { NextRequest } from "next/server"
import { templates } from "@/lib/idcard-templates"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { templateId, students } = await req.json()

    if (!templateId || !students || !Array.isArray(students)) {
      return new Response(JSON.stringify({ error: "Invalid request data" }), { status: 400 })
    }

    const template = templates.find(t => t.id === templateId)
    if (!template) {
      return new Response(JSON.stringify({ error: "Template not found" }), { status: 404 })
    }

    // Return the template and students data for client-side generation
    return new Response(JSON.stringify({ 
      template,
      students,
      message: "Data prepared for client-side generation"
    }), { status: 200 })
  } catch (error) {
    console.error("ID card generation error:", error)
    return new Response(JSON.stringify({ error: "Failed to prepare ID card data" }), { status: 500 })
  }
}
