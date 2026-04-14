create table if not exists public.subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  status text not null default 'active',
  source_page text,
  referrer text,
  user_agent text,
  subscribed_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists subscribers_email_idx on public.subscribers (lower(email));
