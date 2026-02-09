import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";
import { toast } from "sonner";

type StockSlab = Tables<"stock_slabs">;
type SlabInsert = TablesInsert<"stock_slabs">;
type SlabUpdate = TablesUpdate<"stock_slabs">;

export function useSlabs() {
  const queryClient = useQueryClient();

  const slabsQuery = useQuery({
    queryKey: ["stock-slabs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_slabs")
        .select("*")
        .order("stone_name");

      if (error) throw error;
      return data as StockSlab[];
    },
  });

  const createSlab = useMutation({
    mutationFn: async (slab: Omit<SlabInsert, "id" | "created_at" | "updated_at">) => {
      if (!slab.stone_type || !slab.stone_name || !slab.width_mm || !slab.length_mm) {
        throw new Error("Missing required fields: stone_type, stone_name, width_mm, and length_mm are required");
      }

      const { data, error } = await supabase.from("stock_slabs").insert(slab).select().single();

      if (error) {
        console.error("Supabase error details:", { message: error.message, details: error.details, hint: error.hint, code: error.code });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-slabs"] });
      toast.success("Slab added successfully");
    },
    onError: (error: unknown) => {
      console.error("Failed to create slab:", error);
      const errorMessage = (error as { message?: string; error_description?: string })?.message ?? (error as { error_description?: string })?.error_description ?? "Unknown error occurred";
      toast.error(`Failed to add slab: ${errorMessage}`);
    },
  });

  const updateSlab = useMutation({
    mutationFn: async ({ id, ...updates }: SlabUpdate & { id: string }) => {
      const { created_at, updated_at, reserved_quantity, ...cleanUpdates } = updates as SlabUpdate & { created_at?: string; updated_at?: string; reserved_quantity?: number };
      const { data, error } = await supabase.from("stock_slabs").update(cleanUpdates).eq("id", id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Failed to update slab. No rows were updated.");
      if (data.length > 1) console.warn(`Multiple slabs updated for id ${id}, using first result`);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-slabs"] });
      toast.success("Slab updated successfully");
    },
    onError: (error: unknown) => {
      console.error("Failed to update slab:", error);
      toast.error("Failed to update slab. Make sure you have admin or manager permissions.");
    },
  });

  const deleteSlab = useMutation({
    mutationFn: async (id: string) => {
      const { data: currentSlab, error: fetchError } = await supabase
        .from("stock_slabs")
        .select("id, stone_name, quantity, reserved_quantity")
        .eq("id", id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!currentSlab) throw new Error("Slab not found");
      const reserved = (currentSlab.reserved_quantity as number) || 0;
      if (reserved > 0) {
        throw new Error(`Cannot delete slab "${currentSlab.stone_name}". It has ${reserved} slab(s) currently reserved in layout. Please return them to stock first.`);
      }
      const { data, error } = await supabase.from("stock_slabs").delete().eq("id", id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Failed to delete slab. No rows were deleted. You may not have permission to delete this slab.");
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-slabs"] });
      toast.success("Slab deleted successfully");
    },
    onError: (error: unknown) => {
      console.error("Failed to delete slab:", error);
      toast.error("Failed to delete slab. Make sure you have admin or manager permissions.");
    },
  });

  const reserveSlab = useMutation({
    mutationFn: async ({ id, quantity = 1 }: { id: string; quantity?: number }) => {
      const { data: currentSlab, error: fetchError } = await supabase
        .from("stock_slabs")
        .select("quantity, reserved_quantity")
        .eq("id", id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!currentSlab) throw new Error("Slab not found");
      const currentReserved = currentSlab.reserved_quantity != null ? Number(currentSlab.reserved_quantity) : 0;
      const currentQuantity = Number(currentSlab.quantity);
      const newReserved = currentReserved + quantity;
      if (currentQuantity - newReserved < 0) {
        throw new Error(`Not enough stock available. Available: ${currentQuantity - currentReserved}, Requested: ${quantity}`);
      }
      const { data: updatedData, error: updateError } = await supabase
        .from("stock_slabs")
        .update({ reserved_quantity: newReserved })
        .eq("id", id)
        .select();
      if (updateError) throw updateError;
      if (!updatedData || updatedData.length === 0) throw new Error("Failed to update slab. No rows were updated.");
      if (updatedData.length > 1) console.warn(`Multiple slabs updated for id ${id}, using first result`);
      return updatedData[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-slabs"] });
    },
    onError: (error: unknown) => {
      console.error("Failed to reserve slab:", error);
    },
  });

  const releaseSlab = useMutation({
    mutationFn: async ({ id, quantity = 1 }: { id: string; quantity?: number }) => {
      const { data: currentSlab, error: fetchError } = await supabase
        .from("stock_slabs")
        .select("reserved_quantity")
        .eq("id", id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!currentSlab) throw new Error("Slab not found");
      const currentReserved = currentSlab.reserved_quantity != null ? Number(currentSlab.reserved_quantity) : 0;
      const newReserved = Math.max(0, currentReserved - quantity);
      const { data: updatedData, error: updateError } = await supabase
        .from("stock_slabs")
        .update({ reserved_quantity: newReserved })
        .eq("id", id)
        .select();
      if (updateError) throw updateError;
      if (!updatedData || updatedData.length === 0) throw new Error("Failed to update slab. No rows were updated.");
      if (updatedData.length > 1) console.warn(`Multiple slabs updated for id ${id}, using first result`);
      return updatedData[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-slabs"] });
    },
    onError: (error: unknown) => {
      console.error("Failed to release slab:", error);
      toast.error((error as Error)?.message ?? "Failed to release slab");
    },
  });

  return {
    slabs: slabsQuery.data ?? [],
    isLoading: slabsQuery.isLoading,
    error: slabsQuery.error,
    createSlab,
    updateSlab,
    deleteSlab,
    reserveSlab,
    releaseSlab,
  };
}

/** Slabs with quantity > 0 (for nesting). State layer only. */
export function useSlabsWithStock() {
  return useQuery({
    queryKey: ["stock-slabs-with-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_slabs")
        .select("*")
        .gt("quantity", 0)
        .order("stone_name");
      if (error) throw error;
      return data as StockSlab[];
    },
  });
}
