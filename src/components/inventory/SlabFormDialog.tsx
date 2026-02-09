import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Tables } from '@/types/supabase';
import { Loader2 } from 'lucide-react';

type StockSlab = Tables<'stock_slabs'>;

const slabSchema = z.object({
  stone_type: z.string().min(1, 'Stone type is required'),
  stone_name: z.string().min(1, 'Stone name is required'),
  width_mm: z.coerce.number().min(1, 'Width must be positive'),
  length_mm: z.coerce.number().min(1, 'Length must be positive'),
  thickness_mm: z.coerce.number().min(1, 'Thickness must be positive'),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  cost_per_unit: z.coerce.number().optional(),
  charge_per_unit: z.coerce.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type SlabFormData = z.infer<typeof slabSchema>;

interface SlabFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slab?: StockSlab | null;
  onSubmit: (data: SlabFormData) => Promise<void>;
  isSubmitting: boolean;
}

const COMMON_STONE_TYPES = [
  'Granite',
  'Marble',
  'Quartz',
  'Quartzite',
  'Soapstone',
  'Limestone',
  'Travertine',
  'Onyx',
  'Slate',
  'Porcelain',
];

export function SlabFormDialog({
  open,
  onOpenChange,
  slab,
  onSubmit,
  isSubmitting,
}: SlabFormDialogProps) {
  const form = useForm<SlabFormData>({
    resolver: zodResolver(slabSchema),
    defaultValues: {
      stone_type: '',
      stone_name: '',
      width_mm: 3000,
      length_mm: 1400,
      thickness_mm: 20,
      quantity: 1,
      primary_color: '#6b7280',
      secondary_color: '',
      cost_per_unit: undefined,
      charge_per_unit: undefined,
      location: '',
      notes: '',
    },
  });

  // Reset form when dialog opens/closes or slab changes
  useEffect(() => {
    if (open) {
      if (slab) {
        form.reset({
          stone_type: slab.stone_type,
          stone_name: slab.stone_name,
          width_mm: slab.width_mm,
          length_mm: slab.length_mm,
          thickness_mm: slab.thickness_mm,
          quantity: slab.quantity,
          primary_color: slab.primary_color || '#6b7280',
          secondary_color: slab.secondary_color || '',
          cost_per_unit: slab.cost_per_unit ?? undefined,
          charge_per_unit: slab.charge_per_unit ?? undefined,
          location: slab.location || '',
          notes: slab.notes || '',
        });
      } else {
        form.reset({
          stone_type: '',
          stone_name: '',
          width_mm: 3000,
          length_mm: 1400,
          thickness_mm: 20,
          quantity: 1,
          primary_color: '#6b7280',
          secondary_color: '',
          cost_per_unit: undefined,
          charge_per_unit: undefined,
          location: '',
          notes: '',
        });
      }
    }
  }, [open, slab, form]);

  const handleSubmit = async (data: SlabFormData) => {
    await onSubmit(data);
  };

  const primaryColor = form.watch('primary_color');
  const secondaryColor = form.watch('secondary_color');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{slab ? 'Edit Slab' : 'Add New Slab'}</DialogTitle>
          <DialogDescription>
            {slab ? 'Update the slab information below.' : 'Fill in the details to add a new slab to your inventory.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Color Preview */}
            <div 
              className="h-20 rounded-lg border border-border"
              style={{
                background: primaryColor
                  ? secondaryColor
                    ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                    : primaryColor
                  : 'hsl(var(--muted))',
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Stone Type */}
              <FormField
                control={form.control}
                name="stone_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stone Type *</FormLabel>
                    <FormControl>
                      <Input 
                        list="stone-types" 
                        placeholder="e.g. Granite" 
                        {...field} 
                      />
                    </FormControl>
                    <datalist id="stone-types">
                      {COMMON_STONE_TYPES.map(type => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stone Name */}
              <FormField
                control={form.control}
                name="stone_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stone Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Black Galaxy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              {/* Width */}
              <FormField
                control={form.control}
                name="width_mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width (mm) *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Length */}
              <FormField
                control={form.control}
                name="length_mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (mm) *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Thickness */}
              <FormField
                control={form.control}
                name="thickness_mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thickness (mm) *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Primary Color */}
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" className="w-12 h-10 p-1" {...field} />
                      </FormControl>
                      <Input 
                        type="text" 
                        value={field.value || ''} 
                        onChange={field.onChange}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Secondary Color */}
              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color (for veining)</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          type="color" 
                          className="w-12 h-10 p-1" 
                          value={field.value || '#ffffff'}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <Input 
                        type="text" 
                        value={field.value || ''} 
                        onChange={field.onChange}
                        placeholder="Optional"
                        className="flex-1"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Cost */}
              <FormField
                control={form.control}
                name="cost_per_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Unit ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        {...field} 
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Charge */}
              <FormField
                control={form.control}
                name="charge_per_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge per Unit ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        {...field} 
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Rack A, Bay 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about this slab..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {slab ? 'Update Slab' : 'Add Slab'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
