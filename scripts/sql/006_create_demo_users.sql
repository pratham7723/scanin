-- Create demo users in auth.users first, then profiles
-- This is a simplified approach for demo purposes

-- First, let's see what users exist
select id, email from auth.users limit 5;

-- Create a simple demo user profile if one doesn't exist
-- We'll use a fixed UUID for demo purposes
insert into profiles (id, email, full_name, role, password_hash, is_active) 
select 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@university.edu',
  'Admin User',
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  true
where not exists (select 1 from profiles where email = 'admin@university.edu');

insert into profiles (id, email, full_name, role, password_hash, is_active) 
select 
  '00000000-0000-0000-0000-000000000002'::uuid,
  'faculty@university.edu',
  'Faculty User',
  'faculty',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  true
where not exists (select 1 from profiles where email = 'faculty@university.edu');

insert into profiles (id, email, full_name, role, password_hash, is_active) 
select 
  '00000000-0000-0000-0000-000000000003'::uuid,
  'student@university.edu',
  'Student User',
  'student',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  true
where not exists (select 1 from profiles where email = 'student@university.edu');

-- Verify the users were created
select id, email, full_name, role, is_active from profiles where email in ('admin@university.edu', 'faculty@university.edu', 'student@university.edu');
