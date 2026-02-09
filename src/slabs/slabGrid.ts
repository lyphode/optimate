// src/components/slabs/SlabGrid.tsx
'use client'

import { useState } from 'react'
import { useSlabOperations } from '@/hooks/useSlabOperations'
import { SlabCard } from './SlabCard'

export function SlabGrid({ slabs }: { slabs: any[] }) {
  const { sendToCutting, isLoading, selectedSlabIds } = useSlabOperations()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Select/deselect slab
  const toggleSelect = (slabId: string) => {
    setSelectedIds(prev => 
      prev.includes(slabId)
        ? prev.filter(id => id !== slabId)
        : [...prev, slabId]
    )
  }
  
  // Send ALL selected slabs with ONE click
  const handleSendSelectedToCutting = async () => {
    if (selectedIds.length === 0) return
    
    try {
      // Single batch operation for all selected slabs
      await sendToCutting(selectedIds)
      
      // Navigate to optimizer with all IDs
      router.push(`/optimizer?slabs=${selectedIds.join(',')}`)
      
      // Clear selection
      setSelectedIds([])
      
    } catch (error) {
      console.error('Failed to send slabs:', error)
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-amber-600 font-medium">
              {selectedIds.length} slab(s) selected
            </span>
            <div className="space-x-2">
              <button
                onClick={handleSendSelectedToCutting}
                disabled={isLoading}
                className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded font-medium disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : `Send ${selectedIds.length} to Cutting`}
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Slab grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slabs.map(slab => (
          <SlabCard
            key={slab.id}
            slab={slab}
            isSelected={selectedIds.includes(slab.id)}
            onSelect={() => toggleSelect(slab.id)}
            onSendToCutting={() => sendToCutting([slab.id])}
          />
        ))}
      </div>
    </div>
  )
}