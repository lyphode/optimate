-- Update RLS policies for stock_slabs:
-- - All authenticated users can INSERT (add slabs)
-- - Admins and managers can UPDATE and DELETE (edit/delete slabs)

DROP POLICY IF EXISTS "Admins can manage slabs" ON public.stock_slabs;

-- Allow all authenticated users to add slabs (simplified - just check authentication)
CREATE POLICY "All authenticated users can add slabs"
  ON public.stock_slabs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow admins and managers to update slabs
CREATE POLICY "Admins and managers can update slabs"
  ON public.stock_slabs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Allow admins and managers to delete slabs
CREATE POLICY "Admins and managers can delete slabs"
  ON public.stock_slabs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
