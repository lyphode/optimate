// src/store/slab-store.ts
import { create } from 'zustand'
import { SlabService } from '@/lib/api/slabs'
import { produce } from 'immer'

interface Slab {
  id: string
  slab_number: string
  quantity: number
  reserved_quantity: number
  available: number
  status: 'available' | 'reserved' | 'out_of_stock'
}

interface SlabStore {
  // State
  slabs: Record<string, Slab>
  selectedSlabIds: string[]
  
  // Actions
  reserveSlabs: (slabIds: string[]) => Promise<void>
  releaseSlabs: (slabIds: string[]) => Promise<void>
  sendToCutting: (slabIds: string[]) => Promise<void>
  
  // Optimistic updates
  optimisticReserve: (slabIds: string[]) => void
  optimisticRelease: (slabIds: string[]) => void
  
  // Bulk operations
  bulkSelectSlabs: (slabIds: string[]) => void
  clearSelection: () => void
}

export const useSlabStore = create<SlabStore>((set, get) => ({
  slabs: {},
  selectedSlabIds: [],
  
  // Batch reserve slabs with optimistic updates
  reserveSlabs: async (slabIds: string[]) => {
    if (slabIds.length === 0) return
    
    // 1. Optimistic update
    get().optimisticReserve(slabIds)
    
    try {
      // 2. Single database call
      await SlabService.manageSlabReservations({
        slabIds,
        operation: 'reserve',
        quantity: 1,
      })
      
      // 3. Refresh data (single query for all slabs)
      const updatedSlabs = await SlabService.getSlabsBatch(slabIds)
      
      set(state => produce(state, draft => {
        updatedSlabs.forEach(slab => {
          if (draft.slabs[slab.id]) {
            draft.slabs[slab.id] = {
              ...slab,
              available: slab.quantity - slab.reserved_quantity,
              status: slab.quantity - slab.reserved_quantity > 0 ? 'available' : 'reserved'
            }
          }
        })
      }))
      
    } catch (error) {
      // Rollback on error
      get().optimisticRelease(slabIds)
      throw error
    }
  },
  
  // Batch release slabs
  releaseSlabs: async (slabIds: string[]) => {
    if (slabIds.length === 0) return
    
    // Optimistic update
    get().optimisticRelease(slabIds)
    
    try {
      // Single database call
      await SlabService.manageSlabReservations({
        slabIds,
        operation: 'release',
        quantity: 1,
      })
      
      // Refresh
      const updatedSlabs = await SlabService.getSlabsBatch(slabIds)
      
      set(state => produce(state, draft => {
        updatedSlabs.forEach(slab => {
          if (draft.slabs[slab.id]) {
            draft.slabs[slab.id] = {
              ...slab,
              available: slab.quantity - slab.reserved_quantity,
              status: slab.quantity - slab.reserved_quantity > 0 ? 'available' : 'reserved'
            }
          }
        })
      }))
      
    } catch (error) {
      get().optimisticReserve(slabIds) // Rollback
      throw error
    }
  },
  
  // Send slabs to cutting table (reserve + navigate)
  sendToCutting: async (slabIds: string[]) => {
    if (slabIds.length === 0) return
    
    // Single call to reserve all slabs
    await get().reserveSlabs(slabIds)
    
    // Update selection
    set({ selectedSlabIds: slabIds })
    
    // Return the result for navigation
    return
  },
  
  // Optimistic update: reserve
  optimisticReserve: (slabIds: string[]) => {
    set(state => produce(state, draft => {
      slabIds.forEach(id => {
        const slab = draft.slabs[id]
        if (slab) {
          slab.reserved_quantity += 1
          slab.available = Math.max(slab.quantity - slab.reserved_quantity, 0)
          slab.status = slab.available > 0 ? 'available' : 'reserved'
        }
      })
    }))
  },
  
  // Optimistic update: release
  optimisticRelease: (slabIds: string[]) => {
    set(state => produce(state, draft => {
      slabIds.forEach(id => {
        const slab = draft.slabs[id]
        if (slab) {
          slab.reserved_quantity = Math.max(slab.reserved_quantity - 1, 0)
          slab.available = slab.quantity - slab.reserved_quantity
          slab.status = slab.available > 0 ? 'available' : 'reserved'
        }
      })
    }))
  },
  
  // Bulk selection
  bulkSelectSlabs: (slabIds: string[]) => {
    set({ selectedSlabIds: slabIds })
  },
  
  clearSelection: () => {
    set({ selectedSlabIds: [] })
  },
}))