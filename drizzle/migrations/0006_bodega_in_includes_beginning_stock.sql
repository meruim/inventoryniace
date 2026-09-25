CREATE OR REPLACE VIEW public.inventory_view AS
SELECT t.id,
    t.tire_code,
    t.brand,
    t.size,
    t.pattern,
    t.category,
    t.supplier_name,
    t.beginning_stock,
    COALESCE(p.qty, 0::bigint)::integer AS stock_in,
    COALESCE(s.qty, 0::bigint)::integer AS stock_out,
    COALESCE(a.qty, 0::bigint)::integer AS adjustment,
    (t.beginning_stock + COALESCE(p.qty, 0::bigint) - COALESCE(s.qty, 0::bigint) + COALESCE(a.qty, 0::bigint))::integer AS current_stock,
    t.reorder_level,
    t.unit_cost,
    t.selling_price,
    (t.beginning_stock + COALESCE(p.qty, 0::bigint) - COALESCE(s.qty, 0::bigint) + COALESCE(a.qty, 0::bigint))::numeric * t.unit_cost AS stock_value,
        CASE
            WHEN (t.beginning_stock + COALESCE(p.qty, 0::bigint) - COALESCE(s.qty, 0::bigint) + COALESCE(a.qty, 0::bigint)) <= 0 THEN 'OUT OF STOCK'::text
            WHEN (t.beginning_stock + COALESCE(p.qty, 0::bigint) - COALESCE(s.qty, 0::bigint) + COALESCE(a.qty, 0::bigint)) <= t.reorder_level THEN 'REORDER'::text
            ELSE 'IN STOCK'::text
        END AS status,
    (t.beginning_stock + COALESCE(p.qty, 0::bigint))::integer AS bodega_in,
    COALESCE(tr.qty, 0::bigint)::integer AS bodega_out,
    (t.beginning_stock + COALESCE(p.qty, 0::bigint) - COALESCE(tr.qty, 0::bigint))::integer AS bodega_stock,
    COALESCE(tr.qty, 0::bigint)::integer AS store_in,
    COALESCE(s.qty, 0::bigint)::integer AS store_out,
    (COALESCE(tr.qty, 0::bigint) - COALESCE(s.qty, 0::bigint) + COALESCE(a.qty, 0::bigint))::integer AS store_stock
   FROM tires t
     LEFT JOIN ( SELECT purchases.tire_id,
            sum(purchases.qty) AS qty
           FROM purchases
          GROUP BY purchases.tire_id) p ON p.tire_id = t.id
     LEFT JOIN ( SELECT sales.tire_id,
            sum(sales.qty) AS qty
           FROM sales
          GROUP BY sales.tire_id) s ON s.tire_id = t.id
     LEFT JOIN ( SELECT adjustments.tire_id,
            sum(adjustments.qty) AS qty
           FROM adjustments
          GROUP BY adjustments.tire_id) a ON a.tire_id = t.id
     LEFT JOIN ( SELECT transfers.tire_id,
            sum(transfers.qty) AS qty
           FROM transfers
          GROUP BY transfers.tire_id) tr ON tr.tire_id = t.id;