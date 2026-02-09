// src/store/slab-store.ts
import { create } from 'zustand'
import { SlabService } from '@/lib/api/slabs'
import { NavigationService } from '@/lib/api/navigation'
import type { Slab } from '@/types/slabs'
import type { ReservationResult } from '@/types/operations'

// Types
interface SlabStoreState {
  // Data
  slabs: Record<string, Slab>
  selectedSlabIds: string[]
  
  // UI State
  isLoading: boolean
  lastError: string | null
  
  // Metadata
  lastUpdated: number | null
  version: number
}

interface SlabStoreActions {
  // Data Operations
  reserveSlabs: (slabIds: string[], options?: ReservationOptions) => Promise<ReservationResult>
  releaseSlabs: (slabIds: string[], options?: ReservationOptions) => Promise<ReservationResult>
  sendToCutting: (slabIds: string[], navigate?: boolean) => Promise<void>
  
  // Selection Management
  selectSlabs: (slabIds: string[]) => void
  toggleSlabSelection: (slabId: string) => void
  clearSelection: () => void
  
  // State Management
  setSlabs: (slabs: Slab[]) => void
  updateSlab: (slabId: string, updates: Partial<Slab>) => void
  removeSlab: (slabId: string) => void
  
  // UI Actions
  startLoading: () => void
  stopLoading: () => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Optimistic Updates (internal)
  optimisticReserve: (slabIds: string[]) => void
  optimisticRelease: (slabIds: string[]) => void
  rollbackOptimisticUpdate: (slabId: string, originalState: Slab) => void
}

interface ReservationOptions {
  quantity?: number
  projectId?: string
  userId?: string
  skipOptimistic?: boolean
}

// Store implementation
export const useSlabStore = create<SlabStoreState & SlabStoreActions>((set, get) => ({
  // Initial State
  slabs: {},
  selectedSlabIds: [],
  isLoading: false,
  lastError: null,
  lastUpdated: null,
  version: 1,

  // ======================
  // PUBLIC API METHODS
  // ======================

  /**
   * Reserve multiple slabs in a single database call
   */
  reserveSlabs: async (slabIds: string[], options: ReservationOptions = {}) => {
    if (slabIds.length === 0) {
      return { success: false, error: 'No slab IDs provided' }
    }

    const { skipOptimistic = false } = options
    
    try {
      // 1. Start loading
      get().startLoading()
      get().clearError()

      // 2. Optimistic update (if enabled)
      if (!skipOptimistic) {
        get().optimisticReserve(slabIds)
      }

      // 3. Single database call through API layer
      const result = await SlabService.manageSlabReservations({
        slabIds,
        operation: 'reserve',
        quantity: options.quantity || 1,
        projectId: options.projectId,
        userId: options.userId,
      })

      if (!result.success) {
        throw new Error(result.error || 'Reservation failed')
      }

      // 4. Update local state with fresh data
      const updatedSlabs = await SlabService.getSlabsBatch(slabIds)
      get().setSlabs(updatedSlabs)

      // 5. Update metadata
      set({
        lastUpdated: Date.now(),
        version: get().version + 1,
      })

      return {
        success: true,
        processed: slabIds.length,
        data: result,
      }

    } catch (error: any) {
      // 6. Handle errors and rollback
      get().setError(error.message || 'Unknown error')
      
      if (!options.skipOptimistic) {
        // Rollback optimistic updates for failed slabs
        slabIds.forEach(slabId => {
          const original = get().slabs[slabId]
          if (original) {
            get().rollbackOptimisticUpdate(slabId, original)
          }
        })
      }

      return {
        success: false,
        error: error.message,
        processed: 0,
      }
    } finally {
      // 7. Stop loading
      get().stopLoading()
    }
  },

  /**
   * Release multiple slabs in a single database call
   */
  releaseSlabs: async (slabIds: string[], options: ReservationOptions = {}) => {
    if (slabIds.length === 0) {
      return { success: false, error: 'No slab IDs provided' }
    }

    const { skipOptimistic = false } = options
    
    try {
      get().startLoading()
      get().clearError()

      if (!skipOptimistic) {
        get().optimisticRelease(slabIds)
      }

      const result = await SlabService.manageSlabReservations({
        slabIds,
        operation: 'release',
        quantity: options.quantity || 1,
        projectId: options.projectId,
        userId: options.userId,
      })

      if (!result.success) {
        throw new Error(result.error || 'Release failed')
      }

      const updatedSlabs = await SlabService.getSlabsBatch(slabIds)
      get().setSlabs(updatedSlabs)

      set({
        lastUpdated: Date.now(),
        version: get().version + 1,
      })

      return {
        success: true,
        processed: slabIds.length,
        data: result,
      }

    } catch (error: any) {
      get().setError(error.message || 'Unknown error')
      
      if (!options.skipOptimistic) {
        slabIds.forEach(slabId => {
          const original = get().slabs[slabId]
          if (original) {
            get().rollbackOptimisticUpdate(slabId, original)
          }
        })
      }

      return {
        success: false,
        error: error.message,
        processed: 0,
      }
    } finally {
      get().stopLoading()
    }
  },

  /**
   * Reserve slabs and optionally navigate to optimizer
   */
  sendToCutting: async (slabIds: string[], navigate: boolean = true) => {
    if (slabIds.length === 0) return

    try {
      // Reserve slabs
      const result = await get().reserveSlabs(slabIds, {
        skipOptimistic: false,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Update selection
      get().selectSlabs(slabIds)

      // Navigate if requested
      if (navigate && result.success) {
        NavigationService.navigateToOptimizer(slabIds)
      }

    } catch (error: any) {
      get().setError(`Failed to send to cutting: ${error.message}`)
      throw error
    }
  },

  // ======================
  // SELECTION MANAGEMENT
  // ======================

  selectSlabs: (slabIds: string[]) => {
    set({ selectedSlabIds: [...new Set(slabIds)] })
  },

  toggleSlabSelection: (slabId: string) => {
    set(state => {
      const isSelected = state.selectedSlabIds.includes(slabId)
      return {
        selectedSlabIds: isSelected
          ? state.selectedSlabIds.filter(id => id !== slabId)
          : [...state.selectedSlabIds, slabId]
      }
    })
  },

  clearSelection: () => {
    set({ selectedSlabIds: [] })
  },

  // ======================
  // STATE MANAGEMENT
  // ======================

  setSlabs: (slabs: Slab[]) => {
    const slabsMap = slabs.reduce((acc, slab) => {
      acc[slab.id] = slab
      return acc
    }, {} as Record<string, Slab>)

    set({ slabs: slabsMap })
  },

  updateSlab: (slabId: string, updates: Partial<Slab>) => {
    set(state =>
      produce(state, draft => {
        if (draft.slabs[slabId]) {
          draft.slabs[slabId] = { ...draft.slabs[slabId], ...updates }
        }
      })
    )
  },

  removeSlab: (slabId: string) => {
    set(state => ({
      delete draft.slabs[slabId]
      draft.selectedSlabIds = draft.selectedSlabIds.filter(id => id !== slabId);
    }));
  },

  // ======================
  // UI STATE MANAGEMENT
  // ======================

  startLoading: () => {
    set({ isLoading: true })
  },

  stopLoading: () => {
    set({ isLoading: false })
  },

  setError: (error: string | null) => {
    set({ lastError: error })
  },

  clearError: () => {
    set({ lastError: null })
  },

  // ======================
  // OPTIMISTIC UPDATES (INTERNAL)
  // ======================

  optimisticReserve: (slabIds: string{
      slabIds.forEach(slabId => {
        const slab = draft.slabs[slabId]
        if (slab) {
          // Optimistic update
          draft.slabs[slabId] = {
            ...slab,
            reserved_quantity: (slab.reserved_quantity || 0) + 1,
            available: Math.max((slab.quantity || 0) - 