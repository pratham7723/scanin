-- Add ID card templates table
create table if not exists id_card_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  template_data jsonb not null,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add index for user queries
create index if not exists idx_id_card_templates_user_id on id_card_templates(user_id);
create index if not exists idx_id_card_templates_public on id_card_templates(is_public) where is_public = true;

-- Add RLS policies
alter table id_card_templates enable row level security;

-- Users can only see their own templates and public templates
create policy "Users can view own templates and public templates" on id_card_templates
  for select using (
    user_id = auth.uid() or is_public = true
  );

-- Users can only insert their own templates
create policy "Users can insert own templates" on id_card_templates
  for insert with check (user_id = auth.uid());

-- Users can only update their own templates
create policy "Users can update own templates" on id_card_templates
  for update using (user_id = auth.uid());

-- Users can only delete their own templates
create policy "Users can delete own templates" on id_card_templates
  for delete using (user_id = auth.uid());

-- Add updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_id_card_templates_updated_at
  before update on id_card_templates
  for each row execute function update_updated_at_column();
