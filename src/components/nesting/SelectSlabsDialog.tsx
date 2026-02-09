import React, { useState, useMemo, useEffect } from 'react';
import { useSlabs } from '@/hooks/useSlabs';
import { SlabCard } from '@/components/inventory/SlabCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, CheckCircle2 } from 'lucide-react';
import type { Tables } from '@/types/supabase';
import { NestingSlab } from '@/lib/nesting-types';
import { ScrollArea } from '@/components/ui/scroll-area';

type StockSlab = Tables<'stock_slabs'>;

interface SelectSlabsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSlabIds: Set<string>;
  onSlabsSelected: (slabs: NestingSlab[]) => void;
}

export function SelectSlabsDialog({
  open,
  onOpenChange,
  selectedSlabIds,
  onSlabsSelected,
}: SelectSlabsDialogProps) {
  const { slabs, isLoading } = useSlabs();
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set());

  // Reset local selection when dialog opens
  useEffect(() => {
    if (open) {
      setLocalSelected(new Set());
      setSearchQuery('');
    }
  }, [open]);

  // Filter slabs - show all slabs, not just those with quantity > 0
  const filteredSlabs = useMemo(() => {
    let filtered = slabs;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = slabs.filter(slab => 
        slab.stone_name.toLowerCase().includes(query) ||
        slab.stone_type.toLowerCase().includes(query) ||
        slab.location?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [slabs, searchQuery]);

  // Calculate available quantity
  const getAvailableQuantity = (slab: StockSlab) => {
    const reserved = (slab as any).reserved_quantity || 0;
    return Math.max(0, slab.quantity - reserved);
  };

  // Handle slab selection
  const handleSlabToggle = (slab: StockSlab) => {
    const available = getAvailableQuantity(slab);
    if (available <= 0 && !localSelected.has(slab.id)) {
      // Don't allow selection if no available stock
      return;
    }
    
    setLocalSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slab.id)) {
        newSet.delete(slab.id);
      } else {
        newSet.add(slab.id);
      }
      return newSet;
    });
  };

  // Handle confirm
  const handleConfirm = () => {
    if (localSelected.size === 0) {
      return;
    }

    const selectedSlabs = filteredSlabs
      .filter(slab => localSelected.has(slab.id))
      .map(slab => ({
        id: slab.id,
        name: slab.stone_name,
        width: slab.width_mm,
        height: slab.length_mm,
        stoneType: slab.stone_type,
        stoneName: slab.stone_name,
        primaryColor: slab.primary_color || undefined,
        secondaryColor: slab.secondary_color || undefined,
      }));
    
    onSlabsSelected(selectedSlabs);
    setLocalSelected(new Set()); // Reset selection
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Slabs from Inventory</DialogTitle>
          <DialogDescription>
            Choose slabs to add to the cutting layout. Selected slabs will appear in the layout panel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search slabs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected count */}
          {localSelected.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {localSelected.size} slab{localSelected.size !== 1 ? 's' : ''} selected
              </Badge>
            </div>
          )}

          {/* Slabs grid */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading slabs...
              </div>
            ) : filteredSlabs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No slabs match your search' : 'No slabs available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                {filteredSlabs.map(slab => {
                  const isInLayout = selectedSlabIds.has(slab.id);
                  const available = getAvailableQuantity(slab);
                  const isAvailable = available > 0;
                  
                  return (
                    <div key={slab.id} className="relative">
                      <SlabCard
                        slab={slab}
                        isSelected={localSelected.has(slab.id)}
                        onSelect={isAvailable ? handleSlabToggle : () => {}}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onDuplicate={() => {}}
                      />
                      {isInLayout && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          In Layout
                        </div>
                      )}
                      {!isAvailable && !isInLayout && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                          Unavailable
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={localSelected.size === 0}>
            Add {localSelected.size > 0 ? `${localSelected.size} ` : ''}Slab{localSelected.size !== 1 ? 's' : ''} to Layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
