-- Admin roles, permissions, settings and operational helpers.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user','admin','super_admin','support_agent','finance'));

INSERT INTO public.app_config(key, value)
VALUES
  ('site_settings', '{"site_name":"SITES.BD","support_email":"","support_whatsapp":"","support_hours":"24/7","maintenance":false,"site_notice":""}'::jsonb),
  ('policies', '{"terms":"","refund":"","domain_policy":"","privacy":""}'::jsonb),
  ('domain_search_settings', '{"suggestions_enabled":true,"show_prices":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(lower(email));

-- Safe helper view for audit UI joins.
CREATE OR REPLACE VIEW public.admin_audit_with_admin AS
SELECT a.id, a.admin_id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
       p.full_name AS admin_name, p.email AS admin_email
FROM public.admin_audit_logs a
LEFT JOIN public.profiles p ON p.id = a.admin_id;


CREATE OR REPLACE FUNCTION public.enforce_profile_immutable_fields()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND COALESCE(current_setting('app.allow_profile_role_change', true),'off') <> 'on' THEN
    RAISE EXCEPTION 'role cannot be changed directly';
  END IF;
  IF NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN RAISE EXCEPTION 'customer_id cannot be changed'; END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN RAISE EXCEPTION 'email cannot be changed'; END IF;
  IF OLD.mobile_number IS NOT NULL AND NEW.mobile_number IS DISTINCT FROM OLD.mobile_number THEN RAISE EXCEPTION 'mobile_number cannot be changed once set'; END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_profile_role(target_id uuid, new_role text)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.profiles;
BEGIN
  IF new_role NOT IN ('user','admin','super_admin','support_agent','finance') THEN RAISE EXCEPTION 'invalid role'; END IF;
  PERFORM set_config('app.allow_profile_role_change','on',true);
  UPDATE public.profiles SET role=new_role WHERE id=target_id RETURNING * INTO r;
  RETURN r;
END; $$;

REVOKE ALL ON FUNCTION public.admin_set_profile_role(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_role(uuid,text) TO service_role;
