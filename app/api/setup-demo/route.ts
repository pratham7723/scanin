import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const demoAccounts = [
      {
        email: 'student@demo.com',
        password: 'demo123',
        full_name: 'Demo Student',
        role: 'student'
      },
      {
        email: 'faculty@demo.com',
        password: 'demo123',
        full_name: 'Demo Faculty',
        role: 'faculty'
      },
      {
        email: 'admin@demo.com',
        password: 'demo123',
        full_name: 'Demo Admin',
        role: 'admin'
      }
    ]

    const results = []

    for (const account of demoAccounts) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(account.email)
        
        if (existingUser.user) {
          results.push({ email: account.email, status: 'already_exists' })
          continue
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true
        })

        if (authError) {
          results.push({ email: account.email, status: 'auth_error', error: authError.message })
          continue
        }

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: account.full_name,
            role: account.role,
            created_at: new Date().toISOString()
          })

        if (profileError) {
          results.push({ email: account.email, status: 'profile_error', error: profileError.message })
          continue
        }

        results.push({ email: account.email, status: 'created' })

      } catch (error) {
        results.push({ 
          email: account.email, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({
      message: 'Demo account setup completed',
      results
    })

  } catch (error) {
    console.error('Setup demo accounts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
