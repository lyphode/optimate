import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NestingSlab, NestingPart, PlacedPart, getPartColor } from '@/lib/nesting-types';
import { Lock, Unlock, Move, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlabCanvasProps {
  slab: NestingSlab;
  parts: NestingPart[];
  placements: PlacedPart[];
  kerfWidth: number;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  onUpdatePlacement: (partId: string, updates: Partial<PlacedPart>) => void;
  onLockPart: (partId: string, locked: boolean) => void;
  scale?: number;
}

const CANVAS_PADDING = 40;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;

export function SlabCanvas({
  slab,
  parts,
  placements,
  kerfWidth,
  selectedPartId,
  onSelectPart,
  onUpdatePlacement,
  onLockPart,
  scale: externalScale,
}: SlabCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalScale, setInternalScale] = useState(0.3);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragPartStart, setDragPartStart] = useState({ x: 0, y: 0 });

  const scale = externalScale ?? internalScale;

  // Filter placements for this slab
  const slabPlacements = placements.filter(p => p.slabId === slab.id);

  // Get part by ID
  const getPartById = useCallback((partId: string) => {
    return parts.find(p => p.id === partId);
  }, [parts]);

  // Calculate canvas dimensions
  const canvasWidth = slab.width * scale + CANVAS_PADDING * 2;
  const canvasHeight = slab.height * scale + CANVAS_PADDING * 2;

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setInternalScale(prev => Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta)));
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    handleZoom(delta);
  }, [handleZoom]);

  // Handle mouse down on a part
  const handlePartMouseDown = useCallback((e: React.MouseEvent, placement: PlacedPart) => {
    e.stopPropagation();
    const part = getPartById(placement.partId);
    
    if (part?.isLocked) {
      onSelectPart(placement.partId);
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragPartStart({ x: placement.x, y: placement.y });
    onSelectPart(placement.partId);
  }, [getPartById, onSelectPart]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && selectedPartId) {
      const part = getPartById(selectedPartId);
      if (part?.isLocked) return;

      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      
      let newX = Math.max(0, Math.min(slab.width - (part?.width || 0), dragPartStart.x + dx));
      let newY = Math.max(0, Math.min(slab.height - (part?.height || 0), dragPartStart.y + dy));
      
      // Snap to grid (10mm)
      newX = Math.round(newX / 10) * 10;
      newY = Math.round(newY / 10) * 10;
      
      onUpdatePlacement(selectedPartId, { x: newX, y: newY });
    } else if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isPanning, selectedPartId, dragStart, dragPartStart, scale, slab, getPartById, onUpdatePlacement]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  // Handle canvas mouse down for panning
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('slab-background')) {
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      onSelectPart(null);
    }
  }, [onSelectPart]);

  // Rotate selected part
  const handleRotatePart = useCallback(() => {
    if (!selectedPartId) return;
    const placement = placements.find(p => p.partId === selectedPartId);
    if (!placement) return;
    
    const newRotation = ((placement.rotation || 0) + 90) % 360;
    onUpdatePlacement(selectedPartId, { rotation: newRotation });
  }, [selectedPartId, placements, onUpdatePlacement]);

  // Toggle lock on selected part
  const handleToggleLock = useCallback(() => {
    if (!selectedPartId) return;
    const part = getPartById(selectedPartId);
    if (!part) return;
    onLockPart(selectedPartId, !part.isLocked);
  }, [selectedPartId, getPartById, onLockPart]);

  // Render a placed part
  const renderPart = (placement: PlacedPart, index: number) => {
    const part = getPartById(placement.partId);
    if (!part) return null;

    const isSelected = selectedPartId === placement.partId;
    const partColor = getPartColor(index);
    const isRotated = placement.rotation === 90 || placement.rotation === 270;
    
    const displayWidth = isRotated ? placement.height : placement.width;
    const displayHeight = isRotated ? placement.width : placement.height;

    return (
      <div
        key={placement.partId}
        className={cn(
          'absolute cursor-pointer transition-shadow flex items-center justify-center',
          isSelected && 'ring-2 ring-primary ring-offset-1',
          part.isLocked ? 'cursor-not-allowed' : 'cursor-move'
        )}
        style={{
          left: CANVAS_PADDING + placement.x * scale,
          top: CANVAS_PADDING + placement.y * scale,
          width: displayWidth * scale,
          height: displayHeight * scale,
          backgroundColor: partColor,
          opacity: 0.85,
          transform: `rotate(${placement.rotation || 0}deg)`,
          transformOrigin: 'center center',
        }}
        onMouseDown={(e) => handlePartMouseDown(e, placement)}
      >
        <div className="text-xs font-bold text-white drop-shadow-md text-center p-1 truncate max-w-full">
          {part.name}
          <div className="text-[10px] opacity-80">
            {Math.round(displayWidth)} × {Math.round(displayHeight)}
          </div>
        </div>
        {part.isLocked && (
          <Lock className="absolute top-1 right-1 w-3 h-3 text-white drop-shadow-md" />
        )}
      </div>
    );
  };

  // Calculate waste area
  const totalPartArea = slabPlacements.reduce((sum, p) => sum + p.width * p.height, 0);
  const slabArea = slab.width * slab.height;
  const wastePercentage = ((slabArea - totalPartArea) / slabArea * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2">
        <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleZoom(-0.1)}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          {Math.round(scale * 100)}%
        </span>
        <div className="flex-1" />
        {selectedPartId && (
          <>
            <Button variant="outline" size="sm" onClick={handleRotatePart}>
              <RotateCw className="w-4 h-4 mr-1" />
              Rotate
            </Button>
            <Button variant="outline" size="sm" onClick={handleToggleLock}>
              {getPartById(selectedPartId)?.isLocked ? (
                <>
                  <Unlock className="w-4 h-4 mr-1" />
                  Unlock
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-1" />
                  Lock
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-2 text-sm">
        <span className="text-muted-foreground">
          Slab: <span className="text-foreground font-medium">{slab.width} × {slab.height} mm</span>
        </span>
        <span className="text-muted-foreground">
          Parts: <span className="text-foreground font-medium">{slabPlacements.length}</span>
        </span>
        <span className="text-muted-foreground">
          Waste: <span className={cn(
            "font-medium",
            parseFloat(wastePercentage) > 30 ? "text-destructive" : "text-green-500"
          )}>{wastePercentage}%</span>
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative overflow-auto border border-border rounded-lg bg-muted/30"
        style={{ maxHeight: '600px' }}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative"
          style={{
            width: canvasWidth + offset.x,
            height: canvasHeight + offset.y,
            minWidth: '100%',
            minHeight: '400px',
          }}
        >
          {/* Slab background */}
          <div
            className="slab-background absolute"
            style={{
              left: CANVAS_PADDING + offset.x,
              top: CANVAS_PADDING + offset.y,
              width: slab.width * scale,
              height: slab.height * scale,
              backgroundColor: slab.primaryColor || 'hsl(var(--muted))',
              border: '2px solid hsl(var(--border))',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)',
            }}
          >
            {/* Grid lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id={`grid-${slab.id}`}
                  width={100 * scale}
                  height={100 * scale}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${100 * scale} 0 L 0 0 0 ${100 * scale}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${slab.id})`} />
            </svg>
          </div>

          {/* Kerf indicator (visual only) */}
          {kerfWidth > 0 && (
            <div
              className="absolute text-xs text-muted-foreground bg-background/80 px-1 rounded"
              style={{
                left: CANVAS_PADDING + offset.x,
                top: CANVAS_PADDING + offset.y + slab.height * scale + 4,
              }}
            >
              Kerf: {kerfWidth}mm
            </div>
          )}

          {/* Render placed parts */}
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
          >
            {slabPlacements.map((placement, index) => renderPart(placement, index))}
          </div>
        </div>
      </div>
    </div>
  );
}
