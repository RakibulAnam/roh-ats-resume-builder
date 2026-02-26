-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id uuid references auth.users not null primary key,
  user_type text check (user_type in ('student', 'professional')),
  onboarding_complete boolean default false,
  full_name text,
  email text,
  phone text,
  location text,
  linkedin text,
  github text,
  website text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table profiles enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- EXPERIENCES
create table experiences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  company text,
  role text,
  start_date text,
  end_date text,
  is_current boolean default false,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table experiences enable row level security;

create policy "Users can view own experiences" on experiences
  for select using (auth.uid() = user_id);

create policy "Users can insert own experiences" on experiences
  for insert with check (auth.uid() = user_id);

create policy "Users can update own experiences" on experiences
  for update using (auth.uid() = user_id);

create policy "Users can delete own experiences" on experiences
  for delete using (auth.uid() = user_id);

-- EDUCATIONS
create table educations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  school text,
  degree text,
  field text,
  start_date text,
  end_date text,
  gpa text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table educations enable row level security;

create policy "Users can view own educations" on educations
  for select using (auth.uid() = user_id);

create policy "Users can insert own educations" on educations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own educations" on educations
  for update using (auth.uid() = user_id);

create policy "Users can delete own educations" on educations
  for delete using (auth.uid() = user_id);

-- PROJECTS
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  name text,
  description text,
  technologies text[],
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table projects enable row level security;

create policy "Users can view own projects" on projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own projects" on projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on projects
  for delete using (auth.uid() = user_id);

-- SKILLS
create table skills (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table skills enable row level security;

create policy "Users can view own skills" on skills
  for select using (auth.uid() = user_id);

create policy "Users can insert own skills" on skills
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own skills" on skills
  for delete using (auth.uid() = user_id);

-- EXTRACURRICULARS
create table extracurriculars (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text,
  organization text,
  start_date text,
  end_date text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table extracurriculars enable row level security;

create policy "Users can view own extracurriculars" on extracurriculars
  for select using (auth.uid() = user_id);

create policy "Users can insert own extracurriculars" on extracurriculars
  for insert with check (auth.uid() = user_id);

create policy "Users can update own extracurriculars" on extracurriculars
  for update using (auth.uid() = user_id);

create policy "Users can delete own extracurriculars" on extracurriculars
  for delete using (auth.uid() = user_id);

-- AWARDS
create table awards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text,
  issuer text,
  date text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table awards enable row level security;

create policy "Users can view own awards" on awards
  for select using (auth.uid() = user_id);

create policy "Users can insert own awards" on awards
  for insert with check (auth.uid() = user_id);

create policy "Users can update own awards" on awards
  for update using (auth.uid() = user_id);

create policy "Users can delete own awards" on awards
  for delete using (auth.uid() = user_id);

-- CERTIFICATIONS
create table certifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  name text,
  issuer text,
  date text,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table certifications enable row level security;

create policy "Users can view own certifications" on certifications
  for select using (auth.uid() = user_id);

create policy "Users can insert own certifications" on certifications
  for insert with check (auth.uid() = user_id);

create policy "Users can update own certifications" on certifications
  for update using (auth.uid() = user_id);

create policy "Users can delete own certifications" on certifications
  for delete using (auth.uid() = user_id);

-- AFFILIATIONS
create table affiliations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  organization text,
  role text,
  start_date text,
  end_date text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table affiliations enable row level security;

create policy "Users can view own affiliations" on affiliations
  for select using (auth.uid() = user_id);

create policy "Users can insert own affiliations" on affiliations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own affiliations" on affiliations
  for update using (auth.uid() = user_id);

create policy "Users can delete own affiliations" on affiliations
  for delete using (auth.uid() = user_id);

-- PUBLICATIONS
create table publications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text,
  publisher text,
  date text,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table publications enable row level security;

create policy "Users can view own publications" on publications
  for select using (auth.uid() = user_id);

create policy "Users can insert own publications" on publications
  for insert with check (auth.uid() = user_id);

create policy "Users can update own publications" on publications
  for update using (auth.uid() = user_id);

create policy "Users can delete own publications" on publications
  for delete using (auth.uid() = user_id);

-- APPLICATIONS (for tracking job applications)
create table applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  job_title text,
  company text,
  job_description text,
  status text default 'draft',
  optimized_summary text,
  optimized_skills text[],
  optimized_experience jsonb,
  cover_letter text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table applications enable row level security;

create policy "Users can view own applications" on applications
  for select using (auth.uid() = user_id);

create policy "Users can insert own applications" on applications
  for insert with check (auth.uid() = user_id);

create policy "Users can update own applications" on applications
  for update using (auth.uid() = user_id);

create policy "Users can delete own applications" on applications
  for delete using (auth.uid() = user_id);

-- GENERATED RESUMES (Final snapshots)
create table generated_resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text,
  data jsonb,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table generated_resumes enable row level security;

create policy "Users can view own generated resumes" on generated_resumes
  for select using (auth.uid() = user_id);

create policy "Users can insert own generated resumes" on generated_resumes
  for insert with check (auth.uid() = user_id);

create policy "Users can update own generated resumes" on generated_resumes
  for update using (auth.uid() = user_id);

create policy "Users can delete own generated resumes" on generated_resumes
  for delete using (auth.uid() = user_id);

-- TRIGGER to auto-create profile on auth.signup
-- (Optional but recommended for smoother DX)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
