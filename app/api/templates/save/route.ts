import { NextRequest, NextResponse } from 'next/server'
import { getSessionProfile } from '@/lib/auth'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getSessionProfile()

    if (!user || !profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { name, description, templateData, isPublic = false } = await request.json()

    if (!name || !templateData) {
      return NextResponse.json(
        { error: 'Template name and data are required' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('user_templates')
      .insert({
        user_id: user.id,
        name,
        description: description || '',
        template_data: templateData,
        is_public: isPublic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Template save error:', error)
      return NextResponse.json(
        { error: 'Failed to save template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      template: data,
      message: 'Template saved successfully'
    })
  } catch (error) {
    console.error('Save template error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
