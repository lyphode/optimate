// src/lib/api/slabs.ts
import { z } from 'zod'
import type { Slab } from '@/types/slabs'

const reservationSchema = z.object({
  slabIds: z.array(z.string().uuid()).min(1),
  operation: z.enum(['reserve', 'release']),
  quantity: z.number().int().positive().default(1),
  projectId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
})

export class SlabService {
  private static async getClient() {
    const { createClient } = await import('@/lib/supabase/client')
    return createClient()
  }

  static async manageSlabReservations(input: z.infer<typeof reservationSchema>) {
    const validated = reservationSchema.parse(input)
    const supabase = await this.getClient()

    const { data, error } = await supabase.rpc('manage_slab_reservations', {
      p_slab_ids: validated.slabIds,
      p_operation: validated.operation,
      p_quantity: validated.quantity,
      p_user_id: validated.userId,
    })

    if (error) throw new Error(error.message)
    return data
  }

  static async getSlabsBatch(slabIds: string[]) {
    if (slabIds.length === 0) return []
    
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('stock_slabs')
      .select('*')
      .in('id', slabIds)

    if (error) throw error
    return (data || []) as Slab[]
  }
}// src/lib/api/slabs.ts
import { z } from 'zod'
import type { Slab } from '@/types/slabs'

const reservationSchema = z.object({
  slabIds: z.array(z.string().uuid()).min(1),
  operation: z.enum(['reserve', 'release']),
  quantity: z.number().int().positive().default(1),
  projectId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
})

export class SlabService {
  private static async getClient() {
    const { createClient } = await import('@/lib/supabase/client')
    return createClient()
  }

  static async manageSlabReservations(input: z.infer<typeof reservationSchema>) {
    const validated = reservationSchema.parse(input)
    const supabase = await this.getClient()

    const { data, error } = await supabase.rpc('manage_slab_reservations', {
      p_slab_ids: validated.slabIds,
      p_operation: validated.operation,
      p_quantity: validated.quantity,
      p_user_id: validated.userId,
    })

    if (error) throw new Error(error.message)
    return data
  }

  static async getSlabsBatch(slabIds: string[]) {
    if (slabIds.length === 0) return []
    
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('stock_slabs')
      .select('*')
      .in('id', slabIds)

    if (error) throw error
    return (data || []) as Slab[]
  }
}