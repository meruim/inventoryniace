CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TYPE public.app_role AS ENUM ('admin','staff');

CREATE TABLE public.suppliers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), supplier_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, contact_person TEXT, phone TEXT, address TEXT, payment_terms TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.customers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, contact_no TEXT, address TEXT, customer_type TEXT, payment_mode TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.tires (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tire_code TEXT NOT NULL UNIQUE, brand TEXT NOT NULL, size TEXT NOT NULL, pattern TEXT, tire_type TEXT, load_index TEXT, speed_rating TEXT, unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0, selling_price NUMERIC(12,2) NOT NULL DEFAULT 0, reorder_level INTEGER NOT NULL DEFAULT 0, category TEXT, supplier_name TEXT, beginning_stock INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.purchases (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), purchase_date DATE NOT NULL DEFAULT CURRENT_DATE, po_no TEXT, supplier_name TEXT, tire_id UUID NOT NULL REFERENCES public.tires(id) ON DELETE CASCADE, qty INTEGER NOT NULL DEFAULT 0, unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.sales (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sale_date DATE NOT NULL DEFAULT CURRENT_DATE, invoice_no TEXT, customer_name TEXT, customer_phone TEXT, payment_mode TEXT NOT NULL DEFAULT 'Full', amount_paid NUMERIC NOT NULL DEFAULT 0, tire_id UUID NOT NULL REFERENCES public.tires(id) ON DELETE CASCADE, qty INTEGER NOT NULL DEFAULT 0, unit_price NUMERIC(12,2) NOT NULL DEFAULT 0, unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.adjustments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE, reference_no TEXT, tire_id UUID NOT NULL REFERENCES public.tires(id) ON DELETE CASCADE, adjustment_type TEXT, qty INTEGER NOT NULL DEFAULT 0, reason TEXT, approved_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.transfers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), transfer_date DATE NOT NULL DEFAULT CURRENT_DATE, reference_no TEXT, tire_id UUID NOT NULL REFERENCES public.tires(id) ON DELETE CASCADE, qty INTEGER NOT NULL DEFAULT 0, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, role));
CREATE TABLE public.activity_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), occurred_at timestamptz NOT NULL DEFAULT now(), actor_id uuid, actor_email text, action text NOT NULL, table_name text NOT NULL, record_id uuid, summary text, details jsonb);
CREATE INDEX idx_activity_logs_occurred_at ON public.activity_logs (occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers, public.customers, public.tires, public.purchases, public.sales, public.adjustments, public.transfers TO authenticated;
GRANT ALL ON public.suppliers, public.customers, public.tires, public.purchases, public.sales, public.adjustments, public.transfers, public.user_roles, public.activity_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, DELETE ON public.activity_logs TO authenticated;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff')) $$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admins delete activity logs" ON public.activity_logs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tires','suppliers','customers','purchases','sales','adjustments','transfers'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_staff(auth.uid()))', 'staff read ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))', 'staff insert ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', 'staff update ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))', 'admins delete ' || t, t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', 't_' || t || '_updated', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.log_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row_data jsonb; label text;
BEGIN
  IF TG_OP = 'DELETE' THEN row_data := to_jsonb(OLD); ELSE row_data := to_jsonb(NEW); END IF;
  label := COALESCE(row_data->>'tire_code', row_data->>'invoice_no', row_data->>'po_no', row_data->>'reference_no', row_data->>'name', '');
  INSERT INTO public.activity_logs (actor_id, actor_email, action, table_name, record_id, summary, details)
  VALUES (auth.uid(), COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', 'system'), lower(TG_OP), TG_TABLE_NAME, (row_data->>'id')::uuid, NULLIF(label, ''), row_data);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.log_activity() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tires','suppliers','customers','purchases','sales','adjustments','transfers'] LOOP
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_activity()', 't_' || t || '_log', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.sales_fill_defaults() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.unit_cost, 0) = 0 THEN
    SELECT unit_cost INTO NEW.unit_cost FROM public.tires WHERE id = NEW.tire_id;
    NEW.unit_cost := COALESCE(NEW.unit_cost, 0);
  END IF;
  IF NEW.payment_mode = 'Full' THEN NEW.amount_paid := NEW.qty * NEW.unit_price; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_sales_defaults BEFORE INSERT OR UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.sales_fill_defaults();

CREATE OR REPLACE FUNCTION public.sales_sync_customer() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid; n int;
BEGIN
  IF NULLIF(trim(NEW.customer_name), '') IS NULL THEN RETURN NEW; END IF;
  SELECT id INTO cid FROM public.customers WHERE lower(name) = lower(trim(NEW.customer_name)) LIMIT 1;
  IF cid IS NULL THEN
    SELECT count(*) + 1 INTO n FROM public.customers;
    INSERT INTO public.customers (customer_id, name, contact_no, payment_mode, customer_type)
    VALUES ('C-' || lpad(n::text, 4, '0') || '-' || substr(gen_random_uuid()::text, 1, 4), trim(NEW.customer_name), NEW.customer_phone, NEW.payment_mode, 'Walk-in');
  ELSE
    UPDATE public.customers SET contact_no = COALESCE(NULLIF(NEW.customer_phone, ''), contact_no), payment_mode = NEW.payment_mode WHERE id = cid;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_sales_customer AFTER INSERT OR UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.sales_sync_customer();
REVOKE EXECUTE ON FUNCTION public.sales_fill_defaults() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sales_sync_customer() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE VIEW public.inventory_view WITH (security_invoker = on) AS
SELECT t.id, t.tire_code, t.brand, t.size, t.pattern, t.category, t.supplier_name, t.beginning_stock,
  COALESCE(p.qty,0)::int AS stock_in,
  COALESCE(s.qty,0)::int AS stock_out,
  COALESCE(a.qty,0)::int AS adjustment,
  (t.beginning_stock + COALESCE(p.qty,0) - COALESCE(s.qty,0) + COALESCE(a.qty,0))::int AS current_stock,
  t.reorder_level, t.unit_cost, t.selling_price,
  ((t.beginning_stock + COALESCE(p.qty,0) - COALESCE(s.qty,0) + COALESCE(a.qty,0))::numeric * t.unit_cost) AS stock_value,
  CASE WHEN (t.beginning_stock + COALESCE(p.qty,0) - COALESCE(s.qty,0) + COALESCE(a.qty,0)) <= 0 THEN 'OUT OF STOCK'
       WHEN (t.beginning_stock + COALESCE(p.qty,0) - COALESCE(s.qty,0) + COALESCE(a.qty,0)) <= t.reorder_level THEN 'REORDER'
       ELSE 'IN STOCK' END AS status,
  COALESCE(p.qty,0)::int AS bodega_in,
  COALESCE(tr.qty,0)::int AS bodega_out,
  (COALESCE(p.qty,0) - COALESCE(tr.qty,0))::int AS bodega_stock,
  COALESCE(tr.qty,0)::int AS store_in,
  COALESCE(s.qty,0)::int AS store_out,
  (t.beginning_stock + COALESCE(tr.qty,0) - COALESCE(s.qty,0) + COALESCE(a.qty,0))::int AS store_stock
FROM public.tires t
LEFT JOIN (SELECT tire_id, sum(qty) qty FROM public.purchases GROUP BY tire_id) p ON p.tire_id = t.id
LEFT JOIN (SELECT tire_id, sum(qty) qty FROM public.sales GROUP BY tire_id) s ON s.tire_id = t.id
LEFT JOIN (SELECT tire_id, sum(qty) qty FROM public.adjustments GROUP BY tire_id) a ON a.tire_id = t.id
LEFT JOIN (SELECT tire_id, sum(qty) qty FROM public.transfers GROUP BY tire_id) tr ON tr.tire_id = t.id;
GRANT SELECT ON public.inventory_view TO authenticated;

ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tires, public.purchases, public.sales, public.transfers, public.adjustments, public.suppliers, public.customers, public.activity_logs;

INSERT INTO public.tires (tire_code, brand, size, pattern, tire_type, load_index, speed_rating, unit_cost, selling_price, reorder_level, category, supplier_name, beginning_stock) VALUES
('BRG-1856514','Bridgestone','185/65 R14','Ecopia EP150','Passenger','86','H',3200,4200,8,'Passenger','Tirezone Trading',20),
('YOK-2656517','Yokohama','265/65 R17','Geolandar A/T G015','SUV / AT','112','S',8500,10900,4,'SUV','AllTerrain Supply',6),
('GDY-2055516','Goodyear','205/55 R16','Assurance Triplemax 2','Passenger','91','V',4600,6100,6,'Passenger','Tirezone Trading',12);
INSERT INTO public.suppliers (supplier_id, name, contact_person, phone, address, payment_terms) VALUES
('SUP-001','Tirezone Trading','Ana Reyes','0917-000-0000','123 Quezon Ave., Quezon City','30 days'),
('SUP-002','AllTerrain Supply','Mark Santos','0918-000-0000','45 Bonifacio St., Pasig City','COD');