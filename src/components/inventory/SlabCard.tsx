import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Copy } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type StockSlab = Tables<'stock_slabs'>;

interface SlabCardProps {
  slab: StockSlab;
  onEdit: (slab: StockSlab) => void;
  onDelete: (slab: StockSlab) => void;
  onDuplicate: (slab: StockSlab) => void;
}

export function SlabCard({ slab, onEdit, onDelete, onDuplicate }: SlabCardProps) {
  const getStockBadgeVariant = (qty: number) => {
    if (qty === 0) return 'destructive';
    if (qty <= 2) return 'secondary';
    return 'default';
  };

  return (
    <Card className="group hover:ring-1 hover:ring-primary/50 transition-all">
      <CardContent className="p-4">
        {/* Color swatch header */}
        <div 
          className="h-24 rounded-lg mb-3 relative overflow-hidden"
          style={{
            background: slab.primary_color 
              ? slab.secondary_color 
                ? `linear-gradient(135deg, ${slab.primary_color} 0%, ${slab.secondary_color} 100%)`
                : slab.primary_color
              : 'hsl(var(--muted))',
          }}
        >
          {/* Dropdown menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(slab)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(slab)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(slab)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Quantity badge */}
          <Badge 
            variant={getStockBadgeVariant(slab.quantity)}
            className="absolute bottom-2 right-2"
          >
            {slab.quantity} in stock
          </Badge>
        </div>

        {/* Slab info */}
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-sm truncate">{slab.stone_name}</h3>
            <p className="text-xs text-muted-foreground">{slab.stone_type}</p>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{slab.width_mm} × {slab.length_mm} mm</span>
            <span>{slab.thickness_mm}mm thick</span>
          </div>

          {(slab.cost_per_unit || slab.charge_per_unit) && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
              {slab.cost_per_unit && (
                <span className="text-muted-foreground">
                  Cost: ${slab.cost_per_unit}
                </span>
              )}
              {slab.charge_per_unit && (
                <span className="text-primary font-medium">
                  Charge: ${slab.charge_per_unit}
                </span>
              )}
            </div>
          )}

          {slab.location && (
            <p className="text-xs text-muted-foreground truncate">
              📍 {slab.location}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
