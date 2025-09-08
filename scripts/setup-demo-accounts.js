// Script to create demo accounts for testing
// Run this with: node scripts/setup-demo-accounts.js

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

async function createDemoAccounts() {
  console.log('🚀 Setting up demo accounts...')
  
  for (const account of demoAccounts) {
    try {
      console.log(`\n📝 Creating ${account.role} account: ${account.email}`)
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true
      })
      
      if (authError) {
        console.error(`❌ Auth error for ${account.email}:`, authError.message)
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
        console.error(`❌ Profile error for ${account.email}:`, profileError.message)
        continue
      }
      
      console.log(`✅ Successfully created ${account.role} account: ${account.email}`)
      
    } catch (error) {
      console.error(`❌ Error creating ${account.email}:`, error.message)
    }
  }
  
  console.log('\n🎉 Demo account setup complete!')
  console.log('\nDemo credentials:')
  demoAccounts.forEach(account => {
    console.log(`  ${account.role}: ${account.email} / ${account.password}`)
  })
}

createDemoAccounts().catch(console.error)
