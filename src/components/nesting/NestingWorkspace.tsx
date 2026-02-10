import React, { useState, useCallback } from 'react';
import { NestingPart, NestingSlab, PlacedPart } from '@/lib/nesting-types';
import { SlabCanvas } from './SlabCanvas';
import { PartsList } from './PartsList';
import { useNestingOptimization } from '@/hooks/useNestingOptimization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, RotateCcw, Settings2, Layers } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface NestingWorkspaceProps {
  parts: NestingPart[];
  slabs: NestingSlab[];
  kerfWidth: number;
  onPartsChange: (parts: NestingPart[]) => void;
  onKerfWidthChange: (width: number) => void;
}

function getPlacedDimensions(placement: PlacedPart) {
  const isRotated = placement.rotation === 90 || placement.rotation === 270;
  return {
    width: isRotated ? placement.height : placement.width,
    height: isRotated ? placement.width : placement.height,
  };
}

function checkCollision(candidate: PlacedPart, placed: PlacedPart[], kerfWidth: number) {
  const candidateSize = getPlacedDimensions(candidate);

  return placed.some((existing) => {
    if (existing.partId === candidate.partId) return false;

    const existingSize = getPlacedDimensions(existing);

    const aLeft = candidate.x;
    const aRight = candidate.x + candidateSize.width + kerfWidth;
    const aTop = candidate.y;
    const aBottom = candidate.y + candidateSize.height + kerfWidth;

    const bLeft = existing.x;
    const bRight = existing.x + existingSize.width + kerfWidth;
    const bTop = existing.y;
    const bBottom = existing.y + existingSize.height + kerfWidth;

    return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
  });
}

function findBottomLeftPosition(
  partPlacement: PlacedPart,
  slab: NestingSlab,
  occupied: PlacedPart[],
  kerfWidth: number
) {
  const size = getPlacedDimensions(partPlacement);
  const maxX = Math.max(0, slab.width - size.width);
  const maxY = Math.max(0, slab.height - size.height);
  const stepSize = 10;

  for (let y = 0; y <= maxY; y += stepSize) {
    for (let x = 0; x <= maxX; x += stepSize) {
      const candidate: PlacedPart = {
        ...partPlacement,
        x,
        y,
      };

      if (!checkCollision(candidate, occupied, kerfWidth)) {
        return { x, y };
      }
    }
  }

  return null;
}

export function NestingWorkspace({
  parts,
  slabs,
  kerfWidth,
  onPartsChange,
  onKerfWidthChange,
}: NestingWorkspaceProps) {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [activeSlabIndex, setActiveSlabIndex] = useState(0);

  const {
    isOptimizing,
    result,
    placements,
    optimize,
    clearPlacements,
    setPlacements,
  } = useNestingOptimization({ kerfWidth });

  // Run optimization
  const handleOptimize = useCallback(async () => {
    await optimize(parts, slabs);
  }, [optimize, parts, slabs]);

  // Reset optimization
  const handleReset = useCallback(() => {
    clearPlacements();
    setSelectedPartId(null);
  }, [clearPlacements]);

  // Handle lock/unlock part
  const handleLockPart = useCallback((partId: string, locked: boolean) => {
    onPartsChange(
      parts.map(p => p.id === partId ? { 
        ...p, 
        isLocked: locked,
        lockedPosition: locked ? {
          slabId: placements.find(pl => pl.partId === partId)?.slabId || slabs[0]?.id || '',
          x: placements.find(pl => pl.partId === partId)?.x || 0,
          y: placements.find(pl => pl.partId === partId)?.y || 0,
          rotation: placements.find(pl => pl.partId === partId)?.rotation || 0,
        } : undefined,
      } : p)
    );
  }, [parts, placements, slabs, onPartsChange]);

  // Handle placement update
  const handleUpdatePlacement = useCallback((partId: string, updates: Partial<PlacedPart>) => {
    setPlacements((prevPlacements) => {
      const targetPlacement = prevPlacements.find((p) => p.partId === partId);
      if (!targetPlacement) return prevPlacements;

      const slab = slabs.find((s) => s.id === (updates.slabId ?? targetPlacement.slabId));
      if (!slab) {
        return prevPlacements.map((p) => (p.partId === partId ? { ...p, ...updates } : p));
      }

      const movedPlacement: PlacedPart = { ...targetPlacement, ...updates, slabId: slab.id };
      const isMovedPartLocked = parts.find((p) => p.id === partId)?.isLocked;

      const unchanged = prevPlacements.filter(
        (p) => p.slabId !== slab.id || p.partId === partId
      );

      const slabPlacements = prevPlacements.filter(
        (p) => p.slabId === slab.id && p.partId !== partId
      );

      const lockedPartIds = new Set(parts.filter((p) => p.isLocked).map((p) => p.id));

      const lockedPlacements = slabPlacements.filter((p) => lockedPartIds.has(p.partId));
      const movablePlacements = slabPlacements
        .filter((p) => !lockedPartIds.has(p.partId))
        .sort((a, b) => b.width * b.height - a.width * a.height);

      const anchoredPlacements = isMovedPartLocked
        ? [...lockedPlacements]
        : [{ ...movedPlacement }, ...lockedPlacements];

      const rearrangedMovable = movablePlacements.map((placement) => {
        const nextPosition = findBottomLeftPosition(
          placement,
          slab,
          [...anchoredPlacements],
          kerfWidth
        );

        if (!nextPosition) {
          return placement;
        }

        const updatedPlacement = {
          ...placement,
          ...nextPosition,
        };

        anchoredPlacements.push(updatedPlacement);
        return updatedPlacement;
      });

      const finalSlabPlacements = isMovedPartLocked
        ? [...lockedPlacements, ...rearrangedMovable]
        : [{ ...movedPlacement }, ...lockedPlacements, ...rearrangedMovable];

      return [...unchanged.filter((p) => p.partId !== partId), ...finalSlabPlacements];
    });
    
    // If part is locked, also update its locked position
    const part = parts.find(p => p.id === partId);
    if (part?.isLocked) {
      const currentPlacement = placements.find(p => p.partId === partId);
      if (currentPlacement) {
        onPartsChange(
          parts.map(p => p.id === partId ? {
            ...p,
            lockedPosition: {
              ...p.lockedPosition!,
              ...updates,
            },
          } : p)
        );
      }
    }
  }, [setPlacements, slabs, parts, kerfWidth, onPartsChange, placements]);

  // Calculate statistics
  const placedPartsCount = placements.length;
  const unplacedPartsCount = parts.length - placedPartsCount;
  const totalWaste = result?.slabUsage.reduce((sum, s) => sum + s.wastePercentage, 0) || 0;
  const avgWaste = result?.slabUsage.length ? totalWaste / result.slabUsage.length : 0;

  // Get slabs that have parts placed on them
  const usedSlabs = slabs.filter(slab => 
    placements.some(p => p.slabId === slab.id)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left sidebar - Parts list */}
      <div className="lg:col-span-1">
        <PartsList
          parts={parts}
          placements={placements}
          selectedPartId={selectedPartId}
          onSelectPart={setSelectedPartId}
          onPartsChange={onPartsChange}
        />
      </div>

      {/* Main canvas area */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Slab Layout
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleOptimize}
                  disabled={isOptimizing || parts.length === 0 || slabs.length === 0}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  {isOptimizing ? 'Optimizing...' : 'Optimize'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={placements.length === 0}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {slabs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Layers className="w-12 h-12 mb-2 opacity-50" />
                <p>No slabs available</p>
                <p className="text-sm">Add slabs to your inventory first</p>
              </div>
            ) : placements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Play className="w-12 h-12 mb-2 opacity-50" />
                <p>Click "Optimize" to place parts</p>
                <p className="text-sm">Parts will be automatically arranged on slabs</p>
              </div>
            ) : (
              <Tabs value={String(activeSlabIndex)} onValueChange={(v) => setActiveSlabIndex(Number(v))}>
                <TabsList className="mb-4">
                  {usedSlabs.map((slab, index) => (
                    <TabsTrigger key={slab.id} value={String(slabs.indexOf(slab))}>
                      {slab.name || `Slab ${index + 1}`}
                      <Badge variant="secondary" className="ml-2">
                        {placements.filter(p => p.slabId === slab.id).length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {slabs.map((slab, index) => (
                  <TabsContent key={slab.id} value={String(index)}>
                    <SlabCanvas
                      slab={slab}
                      parts={parts}
                      placements={placements}
                      kerfWidth={kerfWidth}
                      selectedPartId={selectedPartId}
                      onSelectPart={setSelectedPartId}
                      onUpdatePlacement={handleUpdatePlacement}
                      onLockPart={handleLockPart}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right sidebar - Settings & Stats */}
      <div className="lg:col-span-1 space-y-4">
        {/* Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Blade Kerf Width: {kerfWidth}mm</Label>
              <Slider
                value={[kerfWidth]}
                onValueChange={([v]) => onKerfWidthChange(v)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {result && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Optimization Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Placed</p>
                  <p className="text-2xl font-bold text-green-500">{placedPartsCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unplaced</p>
                  <p className="text-2xl font-bold text-destructive">{unplacedPartsCount}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average Waste</span>
                  <span className="font-medium">{avgWaste.toFixed(1)}%</span>
                </div>
                <Progress value={100 - avgWaste} className="h-2" />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Per Slab Usage</p>
                {result.slabUsage.map((usage, index) => {
                  const slab = slabs.find(s => s.id === usage.slabId);
                  return (
                    <div key={usage.slabId} className="text-xs">
                      <div className="flex items-center justify-between">
                        <span>{slab?.name || `Slab ${index + 1}`}</span>
                        <span className="text-muted-foreground">
                          {(100 - usage.wastePercentage).toFixed(1)}% used
                        </span>
                      </div>
                      <Progress value={100 - usage.wastePercentage} className="h-1 mt-1" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
