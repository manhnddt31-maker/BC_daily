create table public.bulletin_publications (
  slug text primary key check (slug = 'latest'),
  as_of_date date not null,
  generated_at timestamptz not null,
  payload jsonb not null,
  published_at timestamptz not null default now()
);

alter table public.bulletin_publications enable row level security;

revoke all on table public.bulletin_publications from anon, authenticated;
grant select on table public.bulletin_publications to anon, authenticated;
grant all on table public.bulletin_publications to service_role;

create policy "Bản tin được đọc công khai"
on public.bulletin_publications
for select
to anon, authenticated
using (true);
