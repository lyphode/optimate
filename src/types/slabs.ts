// src/types/slabs.ts
export interface Slab {
    id: string
    slab_number: string
    stone_type: string
    stone_name: string
    primary_color?: string
    secondary_color?: string
    width: number  // in mm
    length: number // in mm
    thickness: number // in mm
    quantity: number
    reserved_quantity: number
    cost?: number
    charge_price?: number
    status: 'available' | 'reserved' | 'cut' | 'sold' | 'archived'
    image_url?: string
    notes?: string
    organization_id?: string
    created_at?: string
    updated_at?: string
    
    // Computed fields (not in database)
    available?: number
    utilization?: number
  }
  
  export interface Offcut {
    id: string
    parent_slab_id: string
    slab_number: string
    width: number
    length: number
    thickness: number
    location_code?: string
    status: 'available' | 'reserved' | 'used'
    created_at?: string
  }
  
  export interface SlabFilters {
    stone_type?: string[]
    min_width?: number
    max_width?: number
    min_length?: number
    max_length?: number
    status?: string[]
    available_only?: boolean
  }
  
  export interface SlabInventoryStats {
    total_slabs: number
    available_slabs: number
    reserved_slabs: number
    total_area: number
    available_area: number
    reserved_area: number
    by_stone_type: Record<string, number>
  }