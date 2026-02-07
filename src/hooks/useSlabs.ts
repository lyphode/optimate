import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type StockSlab = Tables<'stock_slabs'>;
type SlabInsert = TablesInsert<'stock_slabs'>;
type SlabUpdate = TablesUpdate<'stock_slabs'>;

export function useSlabs() {
  const queryClient = useQueryClient();

  const slabsQuery = useQuery({
    queryKey: ['stock-slabs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_slabs')
        .select('*')
        .order('stone_name');
      
      if (error) throw error;
      return data as StockSlab[];
    },
  });

  const createSlab = useMutation({
    mutationFn: async (slab: Omit<SlabInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('stock_slabs')
        .insert(slab)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-slabs'] });
      toast.success('Slab added successfully');
    },
    onError: (error) => {
      console.error('Failed to create slab:', error);
      toast.error('Failed to add slab. Make sure you have admin permissions.');
    },
  });

  const updateSlab = useMutation({
    mutationFn: async ({ id, ...updates }: SlabUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('stock_slabs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-slabs'] });
      toast.success('Slab updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update slab:', error);
      toast.error('Failed to update slab. Make sure you have admin permissions.');
    },
  });

  const deleteSlab = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_slabs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-slabs'] });
      toast.success('Slab deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete slab:', error);
      toast.error('Failed to delete slab. Make sure you have admin permissions.');
    },
  });

  return {
    slabs: slabsQuery.data ?? [],
    isLoading: slabsQuery.isLoading,
    error: slabsQuery.error,
    createSlab,
    updateSlab,
    deleteSlab,
  };
}
