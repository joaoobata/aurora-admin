-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ACCOUNTS (Social Media Accounts)
create table accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  platform text not null check (platform in ('tiktok', 'instagram', 'youtube', 'other')),
  username text not null,
  url text,
  status text default 'active' check (status in ('active', 'inactive', 'banned')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- METRICS (History of performance)
create table metrics (
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references accounts(id) on delete cascade not null,
  followers int default 0,
  views int default 0,
  likes int default 0,
  comments int default 0,
  shares int default 0,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- GOALS (Targets)
create table goals (
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references accounts(id) on delete cascade not null,
  metric_type text not null check (metric_type in ('followers', 'views', 'likes', 'engagement')),
  target_value int not null,
  current_value int default 0,
  deadline timestamp with time zone,
  is_achieved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Security)
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table metrics enable row level security;
alter table goals enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own accounts" on accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on accounts for delete using (auth.uid() = user_id);

-- Metrics are viewable by account owner
create policy "Users can view metrics for own accounts" on metrics for select using (
  exists ( select 1 from accounts where accounts.id = metrics.account_id and accounts.user_id = auth.uid() )
);
create policy "Users can insert metrics for own accounts" on metrics for insert with check (
  exists ( select 1 from accounts where accounts.id = metrics.account_id and accounts.user_id = auth.uid() )
);

-- Goals policies
create policy "Users can view goals for own accounts" on goals for select using (
  exists ( select 1 from accounts where accounts.id = goals.account_id and accounts.user_id = auth.uid() )
);
create policy "Users can manage goals for own accounts" on goals for all using (
  exists ( select 1 from accounts where accounts.id = goals.account_id and accounts.user_id = auth.uid() )
);

-- Function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
