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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { NestingPart, LShapeData, CircleData, ArcData } from '@/lib/nesting-types';

const partSchema = z.object({
  name: z.string().min(1, 'Part name is required'),
  width_mm: z.coerce.number().min(1, 'Width must be positive').optional(),
  length_mm: z.coerce.number().min(1, 'Length must be positive').optional(),
  shape_type: z.enum(['rectangle', 'l_shape', 'circle', 'arc']),
  allow_rotation: z.boolean().default(true),
  notes: z.string().optional(),
  // L-shape specific
  l_shape_main_width: z.coerce.number().min(1).optional(),
  l_shape_main_height: z.coerce.number().min(1).optional(),
  l_shape_cutout_width: z.coerce.number().min(1).optional(),
  l_shape_cutout_height: z.coerce.number().min(1).optional(),
  l_shape_cutout_position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
  // Circle specific
  circle_radius: z.coerce.number().min(1).optional(),
  // Arc specific
  arc_radius: z.coerce.number().min(1).optional(),
  arc_start_angle: z.coerce.number().optional(),
  arc_end_angle: z.coerce.number().optional(),
}).refine((data) => {
  if (data.shape_type === 'rectangle') {
    return data.width_mm && data.length_mm;
  }
  if (data.shape_type === 'l_shape') {
    return data.l_shape_main_width && data.l_shape_main_height && 
           data.l_shape_cutout_width && data.l_shape_cutout_height && 
           data.l_shape_cutout_position;
  }
  if (data.shape_type === 'circle') {
    return data.circle_radius;
  }
  if (data.shape_type === 'arc') {
    return data.arc_radius && data.arc_start_angle !== undefined && data.arc_end_angle !== undefined;
  }
  return true;
}, {
  message: 'Please fill in all required fields for the selected shape type',
});

type PartFormData = z.infer<typeof partSchema>;

interface PartFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part?: NestingPart | null;
  onSubmit: (data: PartFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function PartFormDialog({
  open,
  onOpenChange,
  part,
  onSubmit,
  isSubmitting,
}: PartFormDialogProps) {
  const form = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      name: '',
      width_mm: 600,
      length_mm: 400,
      shape_type: 'rectangle',
      allow_rotation: true,
      notes: '',
    },
  });

  const shapeType = form.watch('shape_type');

  // Reset form when dialog opens/closes or part changes
  useEffect(() => {
    if (open) {
      if (part) {
        const shapeData = part.shapeData as any;
        form.reset({
          name: part.name,
          width_mm: part.width,
          length_mm: part.height,
          shape_type: part.shapeType,
          allow_rotation: part.allowRotation,
          notes: '',
          l_shape_main_width: shapeData?.mainWidth,
          l_shape_main_height: shapeData?.mainHeight,
          l_shape_cutout_width: shapeData?.cutoutWidth,
          l_shape_cutout_height: shapeData?.cutoutHeight,
          l_shape_cutout_position: shapeData?.cutoutPosition,
          circle_radius: shapeData?.radius,
          arc_radius: shapeData?.radius,
          arc_start_angle: shapeData?.startAngle,
          arc_end_angle: shapeData?.endAngle,
        });
      } else {
        form.reset({
          name: '',
          width_mm: 600,
          length_mm: 400,
          shape_type: 'rectangle',
          allow_rotation: true,
          notes: '',
        });
      }
    }
  }, [open, part, form]);

  const handleSubmit = async (data: PartFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{part ? 'Edit Part' : 'Add Part to Cutlist'}</DialogTitle>
          <DialogDescription>
            {part ? 'Update the part information below.' : 'Enter the dimensions and shape details for the part.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Kitchen Countertop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shape_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shape Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shape" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rectangle">Rectangle</SelectItem>
                        <SelectItem value="l_shape">L-Shape</SelectItem>
                        <SelectItem value="circle">Circle</SelectItem>
                        <SelectItem value="arc">Arc</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dimensions - Rectangle */}
            {shapeType === 'rectangle' && (
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            )}

            {/* L-Shape Configuration */}
            {shapeType === 'l_shape' && (
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="text-sm font-medium">L-Shape Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="l_shape_main_width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Width (mm) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="l_shape_main_height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Height (mm) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="l_shape_cutout_width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cutout Width (mm) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="l_shape_cutout_height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cutout Height (mm) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="l_shape_cutout_position"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Cutout Position *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Circle Configuration */}
            {shapeType === 'circle' && (
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="text-sm font-medium">Circle Configuration</h4>
                <FormField
                  control={form.control}
                  name="circle_radius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Radius (mm) *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Arc Configuration */}
            {shapeType === 'arc' && (
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="text-sm font-medium">Arc Configuration</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="arc_radius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Radius (mm) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="arc_start_angle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Angle (°) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="arc_end_angle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Angle (°) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="allow_rotation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Rotation</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow the optimizer to rotate this part for better placement
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this part..."
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
                {part ? 'Update Part' : 'Add Part'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
