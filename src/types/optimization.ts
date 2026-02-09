// src/types/optimization.ts
export interface OptimizationParams {
    project_id: string
    parts: Array<{
      id: string
      width: number
      length: number
      quantity: number
      shape_type: string
      rotation_allowed: boolean
    }>
    slabs: Array<{
      id: string
      width: number
      length: number
      thickness: number
    }>
    locked_positions?: Array<{
      part_id: string
      x: number
      y: number
      rotation: number
    }>
    kerf_width: number
    allow_rotation?: boolean
    grain_direction?: string
  }
  
  export interface OptimizedPart {
    part_id: string
    slab_id: string
    x: number
    y: number
    rotation: number
    slab_index: number
  }
  
  export interface OptimizationResult {
    slabs: Array<{
      slab_id: string
      slab_number: string
      utilization: number
      waste_percentage: number
      area_used: number
      area_total: number
    }>
    parts: OptimizedPart[]
    total_waste_percentage: number
    total_material_utilization: number
    computation_time_ms: number
    algorithm_version: string
  }
  
  export interface Layout {
    id: string
    project_id: string
    slab_id: string
    layout_data: OptimizationResult
    waste_percentage: number
    material_utilization: number
    version: number
    is_current: boolean
    created_by?: string
    created_at?: string
  }