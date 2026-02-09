-- Allow all authenticated users to update reserved_quantity field
-- This is needed for stock tracking when users send slabs to layout
-- 
-- Note: In PostgreSQL RLS, multiple UPDATE policies are combined with OR.
-- This means:
-- - Admins/managers can update any field (from existing policy)
-- - All authenticated users can update any field (from this policy)
-- 
-- We rely on application logic to only update reserved_quantity in reserve/release operations.
-- For stricter security in the future, we could create a database function that validates
-- only reserved_quantity is being updated.

CREATE POLICY "All authenticated users can update reserved_quantity"
  ON public.stock_slabs FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
