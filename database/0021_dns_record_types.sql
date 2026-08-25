-- Adds common DNS record types to the user DNS manager.
alter table public.dns_records drop constraint if exists dns_records_type_check;
alter table public.dns_records drop constraint if exists dns_records_type_check1;
alter table public.dns_records add constraint dns_records_type_check check (type in ('A','AAAA','CNAME','MX','TXT','NS','SRV','CAA','HTTPS','TLSA'));
