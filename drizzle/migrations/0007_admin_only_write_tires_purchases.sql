DROP POLICY IF EXISTS "staff insert tires" ON public.tires;
DROP POLICY IF EXISTS "staff update tires" ON public.tires;
CREATE POLICY "admins insert tires" ON public.tires FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update tires" ON public.tires FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "staff insert purchases" ON public.purchases;
DROP POLICY IF EXISTS "staff update purchases" ON public.purchases;
CREATE POLICY "admins insert purchases" ON public.purchases FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update purchases" ON public.purchases FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));