import React from 'react';
import { NestingPart, PlacedPart, getPartColor } from '@/lib/nesting-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, CheckCircle2, XCircle, Square, Circle, CornerUpLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartsListProps {
  parts: NestingPart[];
  placements: PlacedPart[];
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  onPartsChange: (parts: NestingPart[]) => void;
}

export function PartsList({
  parts,
  placements,
  selectedPartId,
  onSelectPart,
}: PartsListProps) {
  const getShapeIcon = (shapeType: string) => {
    switch (shapeType) {
      case 'circle':
        return Circle;
      case 'l_shape':
        return CornerUpLeft;
      default:
        return Square;
    }
  };

  const isPlaced = (partId: string) => placements.some(p => p.partId === partId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Parts ({parts.length})</CardTitle>
          <Badge variant="secondary">
            {placements.length} placed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="space-y-1 p-4 pt-0">
            {parts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No parts added yet
              </p>
            ) : (
              parts.map((part, index) => {
                const ShapeIcon = getShapeIcon(part.shapeType);
                const placed = isPlaced(part.id);
                const placement = placements.find(p => p.partId === part.id);
                
                return (
                  <div
                    key={part.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                      'hover:bg-muted/50',
                      selectedPartId === part.id && 'bg-muted ring-1 ring-primary'
                    )}
                    onClick={() => onSelectPart(part.id === selectedPartId ? null : part.id)}
                  >
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getPartColor(index) }}
                    />
                    
                    {/* Shape icon */}
                    <ShapeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    
                    {/* Part info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{part.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {part.width} × {part.height} mm
                        {placement && placement.rotation !== 0 && (
                          <span className="ml-1 text-primary">({placement.rotation}°)</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {part.isLocked && (
                        <Lock className="w-3 h-3 text-amber-500" />
                      )}
                      {placed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground/50" />
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
