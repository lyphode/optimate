import React from 'react';
import { NestingSlab, PlacedPart } from '@/lib/nesting-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlabsListProps {
  slabs: NestingSlab[];
  placements: PlacedPart[];
  selectedSlabId: string | null;
  onSelectSlab: (slabId: string | null) => void;
  onSendBackToStock?: (slabId: string) => void;
}

export function SlabsList({
  slabs,
  placements,
  selectedSlabId,
  onSelectSlab,
  onSendBackToStock,
}: SlabsListProps) {
  const getPartsCount = (slabId: string) => {
    return placements.filter(p => p.slabId === slabId).length;
  };

  const hasParts = (slabId: string) => {
    return getPartsCount(slabId) > 0;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Slabs in Layout ({slabs.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4 pt-0">
            {slabs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No slabs in layout
              </p>
            ) : (
              slabs.map((slab) => {
                const partsCount = getPartsCount(slab.id);
                const hasPartsPlaced = hasParts(slab.id);
                
                return (
                  <div
                    key={slab.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border',
                      'hover:bg-muted/50',
                      selectedSlabId === slab.id && 'bg-muted ring-2 ring-primary',
                      hasPartsPlaced && 'border-green-500/50 bg-green-500/5'
                    )}
                    onClick={() => onSelectSlab(slab.id === selectedSlabId ? null : slab.id)}
                  >
                    {/* Color swatch */}
                    <div
                      className="w-8 h-8 rounded-md flex-shrink-0 border border-border"
                      style={{
                        background: slab.primaryColor
                          ? slab.secondaryColor
                            ? `linear-gradient(135deg, ${slab.primaryColor} 0%, ${slab.secondaryColor} 100%)`
                            : slab.primaryColor
                          : 'hsl(var(--muted))',
                      }}
                    />
                    
                    {/* Slab info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{slab.stoneName}</p>
                      <p className="text-xs text-muted-foreground">
                        {slab.width} × {slab.height} mm
                      </p>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasPartsPlaced ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/50">
                            {partsCount} part{partsCount !== 1 ? 's' : ''}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Empty
                        </Badge>
                      )}
                      {onSendBackToStock && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendBackToStock(slab.id);
                          }}
                          title="Send back to stock"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
