REVOKE EXECUTE ON FUNCTION public.sales_sync_customer() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purchases_sync_supplier() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sales_fill_defaults() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_activity() FROM anon, authenticated;