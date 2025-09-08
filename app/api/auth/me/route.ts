import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      // For demo purposes, we'll use hardcoded user data
      // In production, you should fetch from the database
      const demoUsers = [
        { id: '00000000-0000-0000-0000-000000000001', email: 'admin@university.edu', full_name: 'Admin User', role: 'admin', created_at: new Date().toISOString() },
        { id: '00000000-0000-0000-0000-000000000002', email: 'faculty@university.edu', full_name: 'Faculty User', role: 'faculty', created_at: new Date().toISOString() },
        { id: '00000000-0000-0000-0000-000000000003', email: 'student@university.edu', full_name: 'Student User', role: 'student', created_at: new Date().toISOString() }
      ]

      const user = demoUsers.find(u => u.id === decoded.userId)
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at
        }
      })
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
