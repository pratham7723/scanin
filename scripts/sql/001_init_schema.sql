-- Create base schema for role-based classes, lectures, students, attendance
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text check (role in ('admin','coordinator','faculty','student')) default 'student',
  created_at timestamptz default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text,
  batch text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists class_faculty (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  faculty_id uuid not null references profiles(id) on delete cascade,
  unique (class_id, faculty_id)
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete set null,
  prn text,
  enrollment_no text,
  full_name text,
  batch text,
  birthdate date,
  address text,
  mobile text,
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists lectures (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  duration_min int default 60,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references lectures(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  gate_scanned_at timestamptz,
  class_scanned_at timestamptz,
  status text check (status in ('present','late','absent')) default 'present',
  scanned_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  unique(lecture_id, student_id)
);

-- Optional: if students can enroll in multiple classes
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  unique (class_id, student_id)
);
