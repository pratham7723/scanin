import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// File-based storage for templates
const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'templates.json')

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(TEMPLATES_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load templates from file
const loadTemplates = (): any[] => {
  try {
    ensureDataDir()
    if (fs.existsSync(TEMPLATES_FILE)) {
      const data = fs.readFileSync(TEMPLATES_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading templates:', error)
  }
  return []
}

// Save templates to file
const saveTemplates = (templates: any[]) => {
  try {
    ensureDataDir()
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2))
  } catch (error) {
    console.error('Error saving templates:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Load templates from file
    const templates = loadTemplates()
    console.log('📁 Loaded templates from file:', templates.length)
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error in templates GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, template_data, is_public = false } = body

    if (!name || !template_data) {
      return NextResponse.json({ error: 'Name and template data are required' }, { status: 400 })
    }

    // Load existing templates
    const existingTemplates = loadTemplates()

    // Create template object with the structure expected by the component
    const template = {
      id: `template-${Date.now()}`,
      name,
      description: '',
      is_public,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'test-user',
      // Map the template data to the expected structure
      colors: template_data?.colors || { primary: '#3B82F6', secondary: '#1E40AF' },
      front: {
        elements: template_data?.front?.elements || template_data?.front_elements || []
      },
      back: {
        elements: template_data?.back?.elements || template_data?.back_elements || []
      },
      main_background: template_data?.main_background || { innerColor: '#ffffff', borderWidth: 0, borderRadius: 0 },
      // Keep original template_data for backward compatibility
      template_data
    }

    // Add to existing templates
    existingTemplates.push(template)
    
    // Save to file
    saveTemplates(existingTemplates)
    
    console.log('📁 Template saved to file:', template.name)
    console.log('📁 Total templates:', existingTemplates.length)

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error in templates POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, template_data, is_public } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Load existing templates
    const existingTemplates = loadTemplates()
    
    // Find and update template
    const templateIndex = existingTemplates.findIndex(t => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Update template
    existingTemplates[templateIndex] = {
      ...existingTemplates[templateIndex],
      name: name || existingTemplates[templateIndex].name,
      template_data: template_data || existingTemplates[templateIndex].template_data,
      is_public: is_public !== undefined ? is_public : existingTemplates[templateIndex].is_public,
      updated_at: new Date().toISOString()
    }

    // Save to file
    saveTemplates(existingTemplates)
    
    console.log('📁 Template updated in file:', existingTemplates[templateIndex].name)

    return NextResponse.json(existingTemplates[templateIndex])
  } catch (error) {
    console.error('Error in templates PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Load existing templates
    const existingTemplates = loadTemplates()
    
    // Find and remove template
    const templateIndex = existingTemplates.findIndex(t => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Remove template
    const deletedTemplate = existingTemplates.splice(templateIndex, 1)[0]

    // Save to file
    saveTemplates(existingTemplates)
    
    console.log('📁 Template deleted from file:', deletedTemplate.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in templates DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}