-- Add authentication fields to profiles table
alter table profiles add column if not exists password_hash text;
alter table profiles add column if not exists is_active boolean default true;
alter table profiles add column if not exists last_login timestamptz;

-- Create index for email lookups
create index if not exists idx_profiles_email on profiles(email);

-- Insert demo users for testing
insert into profiles (id, email, full_name, role, password_hash, is_active) values
  ('00000000-0000-0000-0000-000000000001', 'admin@university.edu', 'Admin User', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true),
  ('00000000-0000-0000-0000-000000000002', 'faculty@university.edu', 'Faculty User', 'faculty', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true),
  ('00000000-0000-0000-0000-000000000003', 'student@university.edu', 'Student User', 'student', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true)
on conflict (email) do nothing;

-- Update existing profiles to have default password if they don't have one
update profiles 
set password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
where password_hash is null;

-- Add RLS policies for profiles
alter table profiles enable row level security;

-- Users can view their own profile
create policy "Users can view own profile" on profiles
  for select using (id = auth.uid());

-- Users can update their own profile
create policy "Users can update own profile" on profiles
  for update using (id = auth.uid());

-- Admins can view all profiles
create policy "Admins can view all profiles" on profiles
  for select using (
    exists (
      select 1 from profiles p 
      where p.id = auth.uid() 
      and p.role = 'admin'
    )
  );

-- Admins can update all profiles
create policy "Admins can update all profiles" on profiles
  for update using (
    exists (
      select 1 from profiles p 
      where p.id = auth.uid() 
      and p.role = 'admin'
    )
  );
