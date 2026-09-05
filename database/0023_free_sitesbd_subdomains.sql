-- Free lifetime .sites.bd addresses. Safe claim path using SECURITY DEFINER so
-- customers cannot insert arbitrary domain rows directly under RLS.
alter table public.domains add column if not exists is_free_subdomain boolean not null default false;
create index if not exists idx_domains_free_subdomain on public.domains (owner_id, is_free_subdomain) where is_free_subdomain = true;

create or replace function public.claim_free_sitesbd_subdomain(p_label text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_label text := lower(trim(p_label));
  full_domain text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if clean_label !~ '^(?!-)[a-z0-9-]{3,63}(?<!-)$' then raise exception 'invalid subdomain name'; end if;
  if clean_label = any(array['www','mail','api','admin','support','help','status','blog','shop','app','dashboard','account','login','register','sites']) then
    raise exception 'reserved subdomain';
  end if;
  full_domain := clean_label || '.sites.bd';
  if exists(select 1 from public.domains where domain_name = full_domain) then raise exception 'subdomain already claimed'; end if;
  insert into public.domains(owner_id, domain_name, status, auto_renew, registered_at, expires_at, is_free_subdomain)
  values(auth.uid(), full_domain, 'active', false, now(), null, true);
  return full_domain;
end;
$$;
revoke all on function public.claim_free_sitesbd_subdomain(text) from public;
grant execute on function public.claim_free_sitesbd_subdomain(text) to authenticated;
