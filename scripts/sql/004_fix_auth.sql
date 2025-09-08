-- Add authentication fields to profiles table
alter table profiles add column if not exists password_hash text;
alter table profiles add column if not exists is_active boolean default true;
alter table profiles add column if not exists last_login timestamptz;

-- Create index for email lookups
create index if not exists idx_profiles_email on profiles(email);

-- Update existing profiles to have default password if they don't have one
update profiles 
set password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
where password_hash is null;

-- Create templates table
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  template_data jsonb not null,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- Add RLS policies for templates
alter table templates enable row level security;

-- Users can view their own templates
create policy "Users can view own templates" on templates
  for select using (user_id = auth.uid());

-- Public templates are viewable by everyone
create policy "Public templates are viewable by everyone" on templates
  for select using (is_public = true);

-- Users can insert their own templates
create policy "Users can insert own templates" on templates
  for insert with check (user_id = auth.uid());

-- Users can update their own templates
create policy "Users can update own templates" on templates
  for update using (user_id = auth.uid());

-- Users can delete their own templates
create policy "Users can delete own templates" on templates
  for delete using (user_id = auth.uid());

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
