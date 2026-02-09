// src/lib/api/optimization.ts
import { supabase } from '../supabase/client'

export class OptimizationService {
  static async optimizeLayout(projectId: string, options = {}) {
    // Get current session token
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    // Call Edge Function with auth header
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/optimize`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          ...options
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Optimization failed')
    }

    return await response.json()
  }
}