CREATE OR REPLACE VIEW public.inventory_view WITH (security_invoker = on) AS
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
  (t.beginning_stock + COALESCE(p.qty,0) - COALESCE(tr.qty,0))::int AS bodega_stock,
  COALESCE(tr.qty,0)::int AS store_in,
  COALESCE(s.qty,0)::int AS store_out,
  (COALESCE(tr.qty,0) - COALESCE(s.qty,0) + COALESCE(a.qty,0))::int AS store_stock
FROM public.tires t
LEFT JOIN (SELECT tire_id, sum(qty) qty FROM public.purchases GROUP BY tire_id) p ON p.tire_id = t.id
LEFT JOIN (SELECT tire_id, sum(qty) qty FROM public.sales GROUP BY tire_id) s ON s.tire_id = t.id
LEFT JOIN (SELECT tire_id, sum(qty) qty FROM public.adjustments GROUP BY tire_id) a ON a.tire_id = t.id
LEFT JOIN (SELECT tire_id, sum(qty) qty FROM public.transfers GROUP BY tire_id) tr ON tr.tire_id = t.id;
GRANT SELECT ON public.inventory_view TO authenticated;

DROP POLICY IF EXISTS "staff insert transfers" ON public.transfers;
DROP POLICY IF EXISTS "staff update transfers" ON public.transfers;
CREATE POLICY "admins insert transfers" ON public.transfers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update transfers" ON public.transfers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));