// src/types/operations.ts
export interface ReservationOptions {
    quantity?: number
    projectId?: string
    userId?: string
    skipOptimistic?: boolean
  }
  
  export interface ReservationResult {
    success: boolean
    processed?: number
    data?: any
    error?: string
    failed_slabs?: Array<{
      slab_id: string
      error: string
      available?: number
    }>
    timestamp?: string
  }
  
  export interface BatchOperation {
    slabIds: string[]
    operation: 'reserve' | 'release'
    quantity: number
    projectId?: string
    userId?: string
  }
  
  export interface OperationHistory {
    id: string
    slab_id: string
    operation: 'reserve' | 'release' | 'add' | 'remove' | 'update'
    quantity_change: number
    previous_quantity: number
    new_quantity: number
    user_id?: string
    project_id?: string
    notes?: string
    created_at: string
  }