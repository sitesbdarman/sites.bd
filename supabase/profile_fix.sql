-- Fix for: P0001 role cannot be changed directly
-- This trigger blocks only protected fields and allows normal profile updates.

CREATE OR REPLACE FUNCTION public.enforce_profile_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'role cannot be changed directly';
  END IF;

  IF NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
    RAISE EXCEPTION 'customer_id cannot be changed directly';
  END IF;

  RETURN NEW;
END;
$$;

-- Confirm your real columns before making further schema changes:
SELECT ordinal_position, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='profiles'
ORDER BY ordinal_position;
