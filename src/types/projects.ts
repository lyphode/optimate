// src/types/projects.ts
export interface Project {
    id: string
    name: string
    client_id?: string
    room_location?: string
    status: 'draft' | 'in_progress' | 'optimized' | 'cutting' | 'completed' | 'archived'
    settings: {
      kerf_width: number
      allow_rotation: boolean
      grain_direction?: 'horizontal' | 'vertical' | 'none'
      unit: 'mm' | 'inches'
    }
    total_waste_percentage?: number
    created_by?: string
    organization_id?: string
    created_at?: string
    updated_at?: string
  }
  
  export interface Part {
    id: string
    project_id: string
    name: string
    width: number
    length: number
    shape_type: 'rectangle' | 'lshape' | 'circle' | 'arc' | 'custom'
    cutout_details?: Record<string, any>
    edge_profiles?: Record<string, string>
    material_notes?: string
    locked: boolean
    assigned_slab_id?: string
    sort_order: number
    created_at?: string
    updated_at?: string
  }