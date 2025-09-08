-- Insert demo users for testing
-- First, let's check if we have any existing users
select id, email, role from profiles limit 5;

-- Insert demo users (using existing IDs or generate new ones)
insert into profiles (id, email, full_name, role, password_hash, is_active) values
  (gen_random_uuid(), 'admin@university.edu', 'Admin User', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true),
  (gen_random_uuid(), 'faculty@university.edu', 'Faculty User', 'faculty', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true),
  (gen_random_uuid(), 'student@university.edu', 'Student User', 'student', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true)
on conflict (email) do nothing;

-- Verify the users were created
select id, email, full_name, role, is_active from profiles where email in ('admin@university.edu', 'faculty@university.edu', 'student@university.edu');
