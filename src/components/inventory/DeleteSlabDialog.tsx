import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Tables } from '@/types/supabase';
import { Loader2 } from 'lucide-react';

type StockSlab = Tables<'stock_slabs'>;

interface DeleteSlabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slab: StockSlab | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteSlabDialog({
  open,
  onOpenChange,
  slab,
  onConfirm,
  isDeleting,
}: DeleteSlabDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Slab</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{slab?.stone_name}</strong>?
            {(() => {
              const reserved = (slab as any)?.reserved_quantity || 0;
              if (reserved > 0) {
                return `\n\n⚠️ Warning: This slab has ${reserved} unit(s) currently reserved in layout. You must return them to stock before deleting.`;
              }
              return '';
            })()}
            <br /><br />
            This action cannot be undone. The slab will be permanently removed from inventory.
            Any off-cuts linked to this slab will lose their parent reference.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
