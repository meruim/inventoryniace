ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS supplier_phone text, ADD COLUMN IF NOT EXISTS supplier_address text, ADD COLUMN IF NOT EXISTS payment_term text;
CREATE OR REPLACE FUNCTION public.purchases_sync_supplier() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE sid uuid; n int;
BEGIN
  IF NULLIF(trim(NEW.supplier_name), '') IS NULL THEN RETURN NEW; END IF;
  SELECT id INTO sid FROM public.suppliers WHERE lower(name) = lower(trim(NEW.supplier_name)) LIMIT 1;
  IF sid IS NULL THEN
    SELECT count(*) + 1 INTO n FROM public.suppliers;
    INSERT INTO public.suppliers (supplier_id, name, phone, address, payment_terms)
    VALUES ('S-' || lpad(n::text, 4, '0') || '-' || substr(gen_random_uuid()::text, 1, 4), trim(NEW.supplier_name), NULLIF(trim(NEW.supplier_phone), ''), NULLIF(trim(NEW.supplier_address), ''), NEW.payment_term);
  ELSE
    UPDATE public.suppliers SET phone = COALESCE(NULLIF(trim(NEW.supplier_phone), ''), phone),
      address = COALESCE(NULLIF(trim(NEW.supplier_address), ''), address),
      payment_terms = COALESCE(NEW.payment_term, payment_terms)
    WHERE id = sid;
  END IF;
  RETURN NEW;
END; $$;