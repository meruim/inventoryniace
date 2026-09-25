ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_address text;

CREATE OR REPLACE FUNCTION public.sales_sync_customer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE cid uuid; n int;
BEGIN
  IF NULLIF(trim(NEW.customer_name), '') IS NULL THEN RETURN NEW; END IF;
  SELECT id INTO cid FROM public.customers WHERE lower(name) = lower(trim(NEW.customer_name)) LIMIT 1;
  IF cid IS NULL THEN
    SELECT count(*) + 1 INTO n FROM public.customers;
    INSERT INTO public.customers (customer_id, name, contact_no, address, payment_mode, customer_type)
    VALUES ('C-' || lpad(n::text, 4, '0') || '-' || substr(gen_random_uuid()::text, 1, 4), trim(NEW.customer_name), NEW.customer_phone, NULLIF(trim(NEW.customer_address), ''), NEW.payment_mode, 'Walk-in');
  ELSE
    UPDATE public.customers
    SET contact_no = COALESCE(NULLIF(NEW.customer_phone, ''), contact_no),
        address = COALESCE(NULLIF(trim(NEW.customer_address), ''), address),
        payment_mode = NEW.payment_mode
    WHERE id = cid;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.purchases_sync_supplier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE sid uuid; n int;
BEGIN
  IF NULLIF(trim(NEW.supplier_name), '') IS NULL THEN RETURN NEW; END IF;
  SELECT id INTO sid FROM public.suppliers WHERE lower(name) = lower(trim(NEW.supplier_name)) LIMIT 1;
  IF sid IS NULL THEN
    SELECT count(*) + 1 INTO n FROM public.suppliers;
    INSERT INTO public.suppliers (supplier_id, name)
    VALUES ('S-' || lpad(n::text, 4, '0') || '-' || substr(gen_random_uuid()::text, 1, 4), trim(NEW.supplier_name));
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS purchases_sync_supplier_trigger ON public.purchases;
CREATE TRIGGER purchases_sync_supplier_trigger
AFTER INSERT OR UPDATE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.purchases_sync_supplier();