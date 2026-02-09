-- Add reserved_quantity field to track slabs that are in layout/being used
-- Available stock = quantity - reserved_quantity

ALTER TABLE public.stock_slabs 
ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_stock_slabs_reserved ON public.stock_slabs(reserved_quantity);

-- Add comment
COMMENT ON COLUMN public.stock_slabs.reserved_quantity IS 'Number of slabs currently reserved/in layout (not available for other uses)';
