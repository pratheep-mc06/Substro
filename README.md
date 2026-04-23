# Substro

Substro is a bank statement analyzer that automatically detects and helps users cancel recurring subscriptions. 

## Features
- Upload CSV or PDF bank statements
- Instantly detects recurring subscriptions
- Secure: Parsed entirely in your browser
- Direct links to cancel subscriptions
- Built with Next.js 14, TailwindCSS, and Framer Motion

## Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd substro
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy the example env file and fill in your Supabase credentials if you want to use the auth features.
```bash
cp .env.local.example .env.local
```

### 4. Supabase Setup (Optional for Auth & DB)
Run the following SQL in your Supabase SQL Editor:
```sql
-- 1. Profiles (Extended) & Tables
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  currency text default 'INR',
  date_format text default 'DD/MM/YYYY',
  alert_time text default '09:00',
  allow_analytics boolean default true,
  savings_goal numeric default 0,
  created_at timestamptz default now()
);

create table merchants (
  id serial primary key,
  name text not null,
  slug text unique,
  category text,
  cancel_url text,
  logo_url text
);

create table user_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  merchant_id int references merchants(id),
  raw_name text,
  amount numeric,
  frequency text default 'monthly',
  last_date date,
  status text check (status in ('active', 'cancelled')) default 'active',
  confidence text check (confidence in ('high', 'medium', 'low')) default 'medium',
  category text,
  created_at timestamptz default now()
);

create table activity_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  action text not null, -- 'upload', 'cancelled', 'dismissed', 'confirmed', 'goal_set'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table subscription_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  subscription_id uuid references user_subscriptions(id) on delete cascade,
  is_enabled boolean default true,
  reminder_days int default 3, -- days before renewal
  last_notified_at timestamptz,
  created_at timestamptz default now()
);

-- 2. Security
alter table profiles enable row level security;
alter table user_subscriptions enable row level security;
alter table activity_log enable row level security;
alter table subscription_alerts enable row level security;

create policy "Users own their data" on profiles for all using (auth.uid() = id);
create policy "Users own their subscriptions" on user_subscriptions for all using (auth.uid() = user_id);
create policy "Users own their activity" on activity_log for all using (auth.uid() = user_id);
create policy "Users own their alerts" on subscription_alerts for all using (auth.uid() = user_id);


-- 3. Automatic Profile Creation (Run this in Supabase SQL Editor)
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

```

### 5. Run the application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
