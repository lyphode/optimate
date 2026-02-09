import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";
import { toast } from "sonner";
import type { NestingPart } from "@/lib/nesting-types";

type PartInsert = TablesInsert<"parts">;
type PartUpdate = TablesUpdate<"parts">;

interface CreatePartData {
  project_id?: string;
  name: string;
  width_mm: number;
  length_mm: number;
  shape_type: "rectangle" | "l_shape" | "circle" | "arc";
  shape_data?: unknown;
  allow_rotation: boolean;
  notes?: string;
}

export function useParts(projectId?: string | null) {
  const queryClient = useQueryClient();

  const createPart = useMutation({
    mutationFn: async (partData: CreatePartData) => {
      if (!projectId) {
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const nestingPart: NestingPart = {
          id: tempId,
          name: partData.name,
          width: partData.width_mm,
          height: partData.length_mm,
          shapeType: partData.shape_type,
          shapeData: partData.shape_data,
          allowRotation: partData.allow_rotation,
          isLocked: false,
        };
        return nestingPart;
      }

      const { data, error } = await supabase
        .from("parts")
        .insert({
          project_id: projectId,
          name: partData.name,
          width_mm: partData.width_mm,
          length_mm: partData.length_mm,
          shape_type: partData.shape_type,
          shape_data: partData.shape_data || null,
          allow_rotation: partData.allow_rotation,
          notes: partData.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", { message: error.message, details: error.details, hint: error.hint, code: error.code });
        throw error;
      }

      const nestingPart: NestingPart = {
        id: data.id,
        name: data.name,
        width: data.width_mm,
        height: data.length_mm,
        shapeType: data.shape_type,
        shapeData: data.shape_data as NestingPart["shapeData"],
        allowRotation: data.allow_rotation,
        isLocked: data.is_locked,
      };
      return nestingPart;
    },
    onSuccess: () => {
      if (projectId) queryClient.invalidateQueries({ queryKey: ["project-parts", projectId] });
      toast.success("Part added successfully");
    },
    onError: (error: unknown) => {
      console.error("Failed to create part:", error);
      toast.error(`Failed to add part: ${(error as Error)?.message ?? "Unknown error occurred"}`);
    },
  });

  const updatePart = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<PartUpdate>) => {
      if (!projectId) throw new Error("Cannot update part without a project");
      const { data, error } = await supabase.from("parts").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (projectId) queryClient.invalidateQueries({ queryKey: ["project-parts", projectId] });
      toast.success("Part updated successfully");
    },
    onError: (error: unknown) => {
      console.error("Failed to update part:", error);
      toast.error("Failed to update part. Please try again.");
    },
  });

  const deletePart = useMutation({
    mutationFn: async (id: string) => {
      if (!projectId) return;
      const { error } = await supabase.from("parts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (projectId) queryClient.invalidateQueries({ queryKey: ["project-parts", projectId] });
      toast.success("Part deleted successfully");
    },
    onError: (error: unknown) => {
      console.error("Failed to delete part:", error);
      toast.error("Failed to delete part. Please try again.");
    },
  });

  return {
    createPart,
    updatePart,
    deletePart,
  };
}

/** Project parts for nesting (used by Nesting page). State layer only. */
export function useProjectParts(projectId: string | null) {
  return useQuery({
    queryKey: ["project-parts", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("parts")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

/** Project settings (e.g. kerf) for nesting. State layer only. */
export function useProjectSettings(projectId: string | null) {
  return useQuery({
    queryKey: ["project-settings", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase.from("projects").select("kerf_width_mm").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}
