import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NestingWorkspace } from '@/components/nesting/NestingWorkspace';
import { NestingPart, NestingSlab } from '@/lib/nesting-types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Package } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Nesting() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [parts, setParts] = useState<NestingPart[]>([]);
  const [kerfWidth, setKerfWidth] = useState(3);

  // Fetch project parts if projectId is provided
  const { data: projectParts, isLoading: partsLoading } = useQuery({
    queryKey: ['project-parts', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch slabs from inventory
  const { data: slabs, isLoading: slabsLoading, error: slabsError } = useQuery({
    queryKey: ['stock-slabs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_slabs')
        .select('*')
        .gt('quantity', 0)
        .order('stone_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch project settings for kerf width
  const { data: projectSettings } = useQuery({
    queryKey: ['project-settings', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('kerf_width_mm')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Transform database parts to nesting parts
  useEffect(() => {
    if (projectParts) {
      const nestingParts: NestingPart[] = projectParts.map(p => ({
        id: p.id,
        name: p.name,
        width: p.width_mm,
        height: p.length_mm,
        shapeType: p.shape_type,
        shapeData: p.shape_data as any,
        cutouts: p.cutout_data as any,
        edgeProfiles: p.edge_profiles as any,
        allowRotation: p.allow_rotation,
        isLocked: p.is_locked,
        lockedPosition: p.assigned_slab_id ? {
          slabId: p.assigned_slab_id,
          x: p.position_x ?? 0,
          y: p.position_y ?? 0,
          rotation: p.rotation_degrees ?? 0,
        } : undefined,
      }));
      setParts(nestingParts);
    }
  }, [projectParts]);

  // Set kerf width from project settings
  useEffect(() => {
    if (projectSettings?.kerf_width_mm) {
      setKerfWidth(projectSettings.kerf_width_mm);
    }
  }, [projectSettings]);

  // Transform slabs to nesting slabs
  const nestingSlabs: NestingSlab[] = (slabs || []).map(s => ({
    id: s.id,
    name: s.stone_name,
    width: s.width_mm,
    height: s.length_mm,
    stoneType: s.stone_type,
    stoneName: s.stone_name,
    primaryColor: s.primary_color || undefined,
    secondaryColor: s.secondary_color || undefined,
  }));

  // Handle parts change
  const handlePartsChange = (updatedParts: NestingPart[]) => {
    setParts(updatedParts);
  };

  if (partsLoading || slabsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-6">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px] col-span-2" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (slabsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load slabs. Please try again.</AlertDescription>
      </Alert>
    );
  }

  if (nestingSlabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Slabs Available</h2>
        <p className="text-muted-foreground mb-4">
          Add slabs to your inventory before using the nesting optimizer.
        </p>
        <Button onClick={() => navigate('/inventory')}>
          Go to Inventory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nesting Optimizer</h1>
          <p className="text-muted-foreground">
            Optimize part placement on slabs to minimize waste
          </p>
        </div>
      </div>

      <NestingWorkspace
        parts={parts}
        slabs={nestingSlabs}
        kerfWidth={kerfWidth}
        onPartsChange={handlePartsChange}
        onKerfWidthChange={setKerfWidth}
      />
    </div>
  );
}
