import React, { useState, useMemo } from 'react';
import { useSlabs } from '@/hooks/useSlabs';
import { SlabCard } from '@/components/inventory/SlabCard';
import { SlabFormDialog } from '@/components/inventory/SlabFormDialog';
import { DeleteSlabDialog } from '@/components/inventory/DeleteSlabDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, Grid3X3, List, AlertTriangle, Scissors, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Tables } from '@/types/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type StockSlab = Tables<'stock_slabs'>;

export default function Slabs() {
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const { slabs, isLoading, error, createSlab, updateSlab, deleteSlab } = useSlabs();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [stoneTypeFilter, setStoneTypeFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSlabs, setSelectedSlabs] = useState<Set<string>>(new Set());
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<StockSlab | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSlab, setDeletingSlab] = useState<StockSlab | null>(null);

  // All authenticated users can add slabs, but only admins/managers can edit/delete
  const canAddSlabs = !!user;
  const canManageSlabs = isAdmin || isManager;

  // Get unique stone types for filter
  const stoneTypes = useMemo(() => {
    const types = new Set(slabs.map(s => s.stone_type));
    return Array.from(types).sort();
  }, [slabs]);

  // Calculate available quantity (total - reserved)
  const getAvailableQuantity = (slab: StockSlab) => {
    const reserved = (slab as any).reserved_quantity || 0;
    return Math.max(0, slab.quantity - reserved);
  };

  // Filter slabs
  const filteredSlabs = useMemo(() => {
    return slabs.filter(slab => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          slab.stone_name.toLowerCase().includes(query) ||
          slab.stone_type.toLowerCase().includes(query) ||
          slab.location?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Stone type filter
      if (stoneTypeFilter !== 'all' && slab.stone_type !== stoneTypeFilter) {
        return false;
      }

      // Stock filter - use available quantity
      const available = getAvailableQuantity(slab);
      if (stockFilter === 'in-stock' && available === 0) return false;
      if (stockFilter === 'low-stock' && available > 2) return false;
      if (stockFilter === 'out-of-stock' && available > 0) return false;

      return true;
    });
  }, [slabs, searchQuery, stoneTypeFilter, stockFilter]);

  // Stats
  const totalSlabs = slabs.reduce((sum, s) => sum + s.quantity, 0);
  const availableSlabs = slabs.reduce((sum, s) => sum + getAvailableQuantity(s), 0);
  const reservedSlabs = slabs.reduce((sum, s) => sum + ((s as any).reserved_quantity || 0), 0);
  const lowStockCount = slabs.filter(s => getAvailableQuantity(s) > 0 && getAvailableQuantity(s) <= 2).length;
  const outOfStockCount = slabs.filter(s => getAvailableQuantity(s) === 0).length;

  // Handlers
  const handleAdd = () => {
    setEditingSlab(null);
    setFormOpen(true);
  };

  const handleEdit = (slab: StockSlab) => {
    setEditingSlab(slab);
    setFormOpen(true);
  };

  const handleDuplicate = async (slab: StockSlab) => {
    try {
      // Increase the original slab's quantity by 1
      const newQuantity = slab.quantity + 1;
      await updateSlab.mutateAsync({ 
        id: slab.id, 
        quantity: newQuantity 
      });
      
      toast.success(`Slab "${slab.stone_name}" quantity increased to ${newQuantity}`);
    } catch (error) {
      console.error('Failed to update slab quantity:', error);
      toast.error('Failed to increase slab quantity. You may not have permission to update slabs.');
    }
  };

  const handleDelete = (slab: StockSlab) => {
    setDeletingSlab(slab);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      // Clean up the data: convert empty strings to null for optional fields
      const cleanedData = {
        ...data,
        primary_color: data.primary_color || null,
        secondary_color: data.secondary_color || null,
        cost_per_unit: data.cost_per_unit || null,
        charge_per_unit: data.charge_per_unit || null,
        location: data.location || null,
        notes: data.notes || null,
      };

      // Remove system fields before submission
      const { id, created_at, updated_at, reserved_quantity, ...dataToSubmit } = cleanedData as any;
      
      if (editingSlab?.id) {
        await updateSlab.mutateAsync({ id: editingSlab.id, ...dataToSubmit });
      } else {
        await createSlab.mutateAsync(dataToSubmit);
      }
      setFormOpen(false);
      setEditingSlab(null);
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error('Form submission error:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingSlab) {
      await deleteSlab.mutateAsync(deletingSlab.id);
      setDeleteDialogOpen(false);
      setDeletingSlab(null);
    }
  };

  // Handle slab selection
  const handleSlabSelect = (slab: StockSlab) => {
    setSelectedSlabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slab.id)) {
        newSet.delete(slab.id);
      } else {
        newSet.add(slab.id);
      }
      return newSet;
    });
  };

  // Handle send to cutting (reservation happens in Nesting page)
  const handleSendToCutting = async () => {
    if (selectedSlabs.size === 0) return;
    
    const selectedSlabIds = Array.from(selectedSlabs);

    // Only send slabs that appear available (reservation happens in Nesting)
    const availableIds = selectedSlabIds.filter(id => {
      const slab = slabs.find(s => s.id === id);
      return slab ? getAvailableQuantity(slab) > 0 : false;
    });

    if (availableIds.length === 0) {
      toast.error('No available slabs selected. Please check availability and try again.');
      return;
    }

    navigate(`/optimizer?slabs=${availableIds.join(',')}`);
    setSelectedSlabs(new Set()); // Clear selection after sending

    if (availableIds.length < selectedSlabIds.length) {
      toast.warning(`${availableIds.length} of ${selectedSlabIds.length} slab(s) sent to layout`);
    } else {
      toast.success(`Sent ${availableIds.length} slab(s) to layout`);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load slabs. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Slabs</h1>
          <p className="text-muted-foreground">
            Manage your slab inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedSlabs.size > 0 && (
            <Button onClick={handleSendToCutting} className="gap-2 bg-green-600 hover:bg-green-700">
              <Scissors className="h-4 w-4" />
              Send Ready for Cutting ({selectedSlabs.size})
            </Button>
          )}
          {canAddSlabs && (
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Slab
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">Total Slabs</p>
          <p className="text-2xl font-bold">{totalSlabs}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">Unique Types</p>
          <p className="text-2xl font-bold">{stoneTypes.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="text-2xl font-bold text-amber-500">{lowStockCount}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="text-2xl font-bold text-destructive">{outOfStockCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search slabs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={stoneTypeFilter} onValueChange={setStoneTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stone Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {stoneTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {(searchQuery || stoneTypeFilter !== 'all' || stockFilter !== 'all') && (
          <Badge variant="secondary">
            {filteredSlabs.length} of {slabs.length}
          </Badge>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      ) : filteredSlabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
          {slabs.length === 0 ? (
            <>
              <h2 className="text-xl font-semibold mb-2">No Slabs Yet</h2>
              <p className="text-muted-foreground mb-4">
                Add your first slab to get started with inventory management.
              </p>
              {canAddSlabs && (
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Slab
                </Button>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">No Results</h2>
              <p className="text-muted-foreground">
                No slabs match your current filters.
              </p>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSlabs.map(slab => (
            <SlabCard
              key={slab.id}
              slab={slab}
              isSelected={selectedSlabs.has(slab.id)}
              onSelect={handleSlabSelect}
              onEdit={canManageSlabs ? handleEdit : () => {}}
              onDelete={canManageSlabs ? handleDelete : () => {}}
              onDuplicate={canManageSlabs ? handleDuplicate : () => {}}
            />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Color</th>
                <th className="text-left p-3 text-sm font-medium">Name</th>
                <th className="text-left p-3 text-sm font-medium">Type</th>
                <th className="text-left p-3 text-sm font-medium">Dimensions</th>
                <th className="text-left p-3 text-sm font-medium">Qty</th>
                <th className="text-left p-3 text-sm font-medium">Location</th>
                <th className="text-left p-3 text-sm font-medium">Cost</th>
                <th className="text-left p-3 text-sm font-medium">Charge</th>
                {canManageSlabs && (
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredSlabs.map(slab => (
                <tr 
                  key={slab.id} 
                  className={cn(
                    "border-t border-border hover:bg-muted/30 cursor-pointer",
                    canManageSlabs && "hover:bg-muted/50"
                  )}
                  onClick={() => canManageSlabs && handleEdit(slab)}
                >
                  <td className="p-3">
                    <div 
                      className="w-8 h-8 rounded-md"
                      style={{
                        background: slab.primary_color 
                          ? slab.secondary_color
                            ? `linear-gradient(135deg, ${slab.primary_color} 0%, ${slab.secondary_color} 100%)`
                            : slab.primary_color
                          : 'hsl(var(--muted))',
                      }}
                    />
                  </td>
                  <td className="p-3 font-medium">{slab.stone_name}</td>
                  <td className="p-3 text-muted-foreground">{slab.stone_type}</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {slab.width_mm} × {slab.length_mm} × {slab.thickness_mm}mm
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <Badge variant={getAvailableQuantity(slab) === 0 ? 'destructive' : getAvailableQuantity(slab) <= 2 ? 'secondary' : 'default'}>
                        {getAvailableQuantity(slab)} available
                      </Badge>
                      {((slab as any).reserved_quantity || 0) > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {slab.quantity} total, {((slab as any).reserved_quantity || 0)} in layout
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{slab.location || '-'}</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {slab.cost_per_unit ? `$${slab.cost_per_unit}` : '-'}
                  </td>
                  <td className="p-3 text-sm text-primary font-medium">
                    {slab.charge_per_unit ? `$${slab.charge_per_unit}` : '-'}
                  </td>
                  {canManageSlabs && (
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(slab);
                        }}
                        title="Delete slab"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      <SlabFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        slab={editingSlab}
        onSubmit={handleFormSubmit}
        isSubmitting={createSlab.isPending || updateSlab.isPending}
      />

      <DeleteSlabDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeletingSlab(null);
          }
        }}
        slab={deletingSlab}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteSlab.isPending}
      />
    </div>
  );
}
