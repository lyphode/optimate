// src/hooks/useSlabOperations.ts
import { useSlabStore } from '@/store/slab-store'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

export function useSlabOperations() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const store = useSlabStore()
  
  const sendToCutting = async (slabIds: string[]) => {
    if (slabIds.length === 0) return
    
    setIsLoading(true)
    
    try {
      // Single batch operation
      await store.sendToCutting(slabIds)
      
      toast({
        title: 'Success',
        description: `${slabIds.length} slab(s) sent to cutting table`,
        variant: 'default',
      })
      
      return slabIds
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send slabs to cutting',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  const releaseFromCutting = async (slabIds: string[]) => {
    if (slabIds.length === 0) return
    
    setIsLoading(true)
    
    try {
      // Single batch operation
      await store.releaseSlabs(slabIds)
      
      toast({
        title: 'Success',
        description: `${slabIds.length} slab(s) released back to stock`,
        variant: 'default',
      })
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to release slabs',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  
  const bulkSelectAndSend = async (slabIds: string[]) => {
    // Update selection first
    store.bulkSelectSlabs(slabIds)
    
    // Then send to cutting
    return await sendToCutting(slabIds)
  }
  
  return {
    sendToCutting,
    releaseFromCutting,
    bulkSelectAndSend,
    isLoading,
    selectedSlabIds: store.selectedSlabIds,
  }
}