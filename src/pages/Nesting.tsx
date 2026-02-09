import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NestingWorkspace } from '@/components/nesting/NestingWorkspace';
import { PartFormDialog } from '@/components/nesting/PartFormDialog';
import { SelectSlabsDialog } from '@/components/nesting/SelectSlabsDialog';
import { useParts } from '@/hooks/useParts';
import { useSlabs } from '@/hooks/useSlabs';
import { useProjectParts, useProjectSettings, useSlabsWithStock } from '@/state';
import { NestingPart, NestingSlab, LShapeData, CircleData, ArcData } from '@/lib/nesting-types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Package } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function Nesting() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const slabsParam = searchParams.get('slabs');
  
  const [parts, setParts] = useState<NestingPart[]>([]);
  const [kerfWidth, setKerfWidth] = useState(3);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<NestingPart | null>(null);
  const [selectedSlabIds, setSelectedSlabIds] = useState<Set<string>>(new Set());
  const [additionalSlabs, setAdditionalSlabs] = useState<NestingSlab[]>([]);
  const [selectSlabsDialogOpen, setSelectSlabsDialogOpen] = useState(false);

  const { createPart } = useParts(projectId);
  const { reserveSlab, releaseSlab } = useSlabs();

  const { data: projectParts, isLoading: partsLoading } = useProjectParts(projectId);
  const { data: slabs, isLoading: slabsLoading, error: slabsError } = useSlabsWithStock();
  const { data: projectSettings } = useProjectSettings(projectId);

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

  // Handle selected slabs from URL params and reserve them
  const lastReservedParamRef = useRef<string | null>(null);
  useEffect(() => {
    if (slabsParam && slabs && slabs.length > 0) {
      if (lastReservedParamRef.current === slabsParam) return;
      lastReservedParamRef.current = slabsParam;

      const ids = slabsParam.split(',').filter(Boolean);
      const newIds = new Set(ids);
      setSelectedSlabIds(newIds);
      
      // Reserve slabs that were sent from inventory (only once)
      // Use a ref-like pattern to avoid double reservation
      const reservePromises = ids.map(async (slabId) => {
        const slab = slabs.find(s => s.id === slabId);
        if (slab) {
          try {
            await reserveSlab.mutateAsync({ id: slabId, quantity: 1 });
          } catch (error) {
            console.error(`Failed to reserve slab ${slabId}:`, error);
          }
        }
      });
      
      Promise.all(reservePromises).catch(console.error);
    }
  }, [slabsParam, slabs, reserveSlab]);

  // Transform slabs to nesting slabs, prioritizing selected ones
  const nestingSlabs: NestingSlab[] = useMemo(() => {
    const allSlabs = (slabs || []).map(s => ({
      id: s.id,
      name: s.stone_name,
      width: s.width_mm,
      height: s.length_mm,
      stoneType: s.stone_type,
      stoneName: s.stone_name,
      primaryColor: s.primary_color || undefined,
      secondaryColor: s.secondary_color || undefined,
    }));

    // Combine with additional slabs from dialog
    const combinedSlabs = [...allSlabs];
    
    // Add additional slabs that aren't already in the list
    additionalSlabs.forEach(additionalSlab => {
      if (!combinedSlabs.find(s => s.id === additionalSlab.id)) {
        combinedSlabs.push(additionalSlab);
      }
    });

    // If we have selected slabs, show those first, then others
    if (selectedSlabIds.size > 0) {
      const selected = combinedSlabs.filter(s => selectedSlabIds.has(s.id));
      const others = combinedSlabs.filter(s => !selectedSlabIds.has(s.id));
      return [...selected, ...others];
    }

    return combinedSlabs;
  }, [slabs, selectedSlabIds, additionalSlabs]);

  // Handle adding slabs from selection dialog
  const handleSlabsSelected = async (newSlabs: NestingSlab[]) => {
    const newIds = new Set(selectedSlabIds);
    
    // Reserve slabs in database
    for (const slab of newSlabs) {
      if (!selectedSlabIds.has(slab.id)) {
        try {
          await reserveSlab.mutateAsync({ id: slab.id, quantity: 1 });
          newIds.add(slab.id);
        } catch (error) {
          console.error(`Failed to reserve slab ${slab.id}:`, error);
        }
      }
    }
    
    setSelectedSlabIds(newIds);
    
    // Add to additional slabs if not already in the main slabs list
    setAdditionalSlabs(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      const slabsToAdd = newSlabs.filter(s => !existingIds.has(s.id));
      return [...prev, ...slabsToAdd];
    });
    
    toast.success(`Added ${newSlabs.length} slab${newSlabs.length !== 1 ? 's' : ''} to layout`);
  };

  // Handle parts change
  const handlePartsChange = (updatedParts: NestingPart[]) => {
    setParts(updatedParts);
  };

  // Handle add part button click
  const handleAddPart = () => {
    setEditingPart(null);
    setFormOpen(true);
  };

  // Send slab back to stock: release reservation and remove from nesting list
  const handleSendBackToStock = async (slabId: string) => {
    try {
      await releaseSlab.mutateAsync({ id: slabId, quantity: 1 });
      setSelectedSlabIds(prev => {
        const next = new Set(prev);
        next.delete(slabId);
        return next;
      });
      setAdditionalSlabs(prev => prev.filter(s => s.id !== slabId));
      toast.success('Slab returned to stock');
    } catch (error) {
      console.error('Failed to release slab:', error);
      toast.error('Failed to return slab to stock');
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    try {
      // Transform form data to shape data based on shape type
      let shapeData: LShapeData | CircleData | ArcData | undefined;
      
      if (data.shape_type === 'l_shape') {
        shapeData = {
          mainWidth: data.l_shape_main_width!,
          mainHeight: data.l_shape_main_height!,
          cutoutWidth: data.l_shape_cutout_width!,
          cutoutHeight: data.l_shape_cutout_height!,
          cutoutPosition: data.l_shape_cutout_position!,
        };
      } else if (data.shape_type === 'circle') {
        shapeData = {
          radius: data.circle_radius!,
        };
      } else if (data.shape_type === 'arc') {
        shapeData = {
          radius: data.arc_radius!,
          startAngle: data.arc_start_angle!,
          endAngle: data.arc_end_angle!,
        };
      }

      // Calculate bounding box dimensions
      let width = data.width_mm;
      let height = data.length_mm;

      if (data.shape_type === 'circle' && shapeData) {
        const circleData = shapeData as CircleData;
        width = height = circleData.radius * 2;
      } else if (data.shape_type === 'arc' && shapeData) {
        const arcData = shapeData as ArcData;
        width = height = arcData.radius * 2;
      } else if (data.shape_type === 'l_shape' && shapeData) {
        const lData = shapeData as LShapeData;
        width = Math.max(lData.mainWidth, lData.cutoutWidth);
        height = Math.max(lData.mainHeight, lData.cutoutHeight);
      }

      const partData = {
        name: data.name,
        width_mm: width,
        length_mm: height,
        shape_type: data.shape_type,
        shape_data: shapeData || null,
        allow_rotation: data.allow_rotation,
        notes: data.notes || null,
      };

      const newPart = await createPart.mutateAsync(partData);
      
      // Add to local parts list
      setParts(prev => [...prev, newPart]);
      
      setFormOpen(false);
      setEditingPart(null);
    } catch (error) {
      // Error is already handled by the mutation
      console.error('Failed to add part:', error);
    }
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
        onAddPart={handleAddPart}
        onAddSlabs={() => setSelectSlabsDialogOpen(true)}
        onSendBackToStock={handleSendBackToStock}
      />

      <PartFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        part={editingPart}
        onSubmit={handleFormSubmit}
        isSubmitting={createPart.isPending}
      />

      <SelectSlabsDialog
        open={selectSlabsDialogOpen}
        onOpenChange={setSelectSlabsDialogOpen}
        selectedSlabIds={selectedSlabIds}
        onSlabsSelected={handleSlabsSelected}
      />
    </div>
  );
}
