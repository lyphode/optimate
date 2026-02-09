import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { NestingPart, NestingSlab, NestingResult, PlacedPart } from "@/lib/nesting-types";
import { toast } from "sonner";

interface UseNestingOptimizationOptions {
  kerfWidth: number;
}

export function useNestingOptimization({ kerfWidth }: UseNestingOptimizationOptions) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<NestingResult | null>(null);
  const [placements, setPlacements] = useState<PlacedPart[]>([]);

  const optimize = useCallback(
    async (parts: NestingPart[], slabs: NestingSlab[]) => {
      if (parts.length === 0) {
        toast.error("No parts to optimize");
        return null;
      }
      if (slabs.length === 0) {
        toast.error("No slabs available for nesting");
        return null;
      }

      setIsOptimizing(true);

      try {
        const { data, error } = await supabase.functions.invoke("optimize-nesting", {
          body: {
            parts: parts.map((p) => ({
              id: p.id,
              name: p.name,
              width: p.width,
              height: p.height,
              shapeType: p.shapeType,
              shapeData: p.shapeData,
              allowRotation: p.allowRotation,
              isLocked: p.isLocked,
              lockedPosition: p.lockedPosition,
            })),
            slabs: slabs.map((s) => ({
              id: s.id,
              name: s.name,
              width: s.width,
              height: s.height,
            })),
            kerfWidth,
          },
        });

        if (error) throw error;

        const nestingResult = data as NestingResult;
        setResult(nestingResult);
        setPlacements(nestingResult.placements);

        if (nestingResult.unplacedParts.length > 0) {
          toast.warning(`${nestingResult.unplacedParts.length} part(s) could not be placed`);
        } else {
          toast.success("Optimization complete");
        }

        return nestingResult;
      } catch (error) {
        console.error("Optimization failed:", error);
        toast.error("Optimization failed. Please try again.");
        return null;
      } finally {
        setIsOptimizing(false);
      }
    },
    [kerfWidth]
  );

  const updatePlacement = useCallback((partId: string, updates: Partial<PlacedPart>) => {
    setPlacements((prev) => prev.map((p) => (p.partId === partId ? { ...p, ...updates } : p)));
  }, []);

  const lockPart = useCallback((partId: string, position: { x: number; y: number; rotation: number; slabId: string }) => {
    setPlacements((prev) => prev.map((p) => (p.partId === partId ? { ...p, ...position } : p)));
  }, []);

  const clearPlacements = useCallback(() => {
    setPlacements([]);
    setResult(null);
  }, []);

  return {
    isOptimizing,
    result,
    placements,
    optimize,
    updatePlacement,
    lockPart,
    clearPlacements,
    setPlacements,
  };
}
