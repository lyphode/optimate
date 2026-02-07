import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types for the nesting algorithm
interface Part {
  id: string;
  name: string;
  width: number;
  height: number;
  shapeType: 'rectangle' | 'l_shape' | 'circle' | 'arc';
  shapeData?: LShapeData | CircleData | ArcData;
  allowRotation: boolean;
  isLocked: boolean;
  lockedPosition?: { x: number; y: number; rotation: number };
}

interface LShapeData {
  mainWidth: number;
  mainHeight: number;
  cutoutWidth: number;
  cutoutHeight: number;
  cutoutPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface CircleData {
  radius: number;
}

interface ArcData {
  radius: number;
  startAngle: number;
  endAngle: number;
}

interface Slab {
  id: string;
  width: number;
  height: number;
  name: string;
}

interface PlacedPart {
  partId: string;
  slabId: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
}

interface NestingRequest {
  parts: Part[];
  slabs: Slab[];
  kerfWidth: number;
}

interface NestingResult {
  placements: PlacedPart[];
  unplacedParts: string[];
  slabUsage: { slabId: string; usedArea: number; totalArea: number; wastePercentage: number }[];
}

// Shelf-based bin packing algorithm with support for locked parts
class ShelfPacker {
  private shelves: { y: number; height: number; usedWidth: number }[] = [];
  private placements: { x: number; y: number; width: number; height: number; partId: string }[] = [];
  
  constructor(
    private slabWidth: number,
    private slabHeight: number,
    private kerfWidth: number
  ) {}

  // Get bounding box for different shape types
  private getBoundingBox(part: Part, rotated: boolean): { width: number; height: number } {
    let width = part.width;
    let height = part.height;

    if (part.shapeType === 'circle' && part.shapeData) {
      const circleData = part.shapeData as CircleData;
      width = height = circleData.radius * 2;
    } else if (part.shapeType === 'arc' && part.shapeData) {
      const arcData = part.shapeData as ArcData;
      width = height = arcData.radius * 2;
    }

    if (rotated && part.allowRotation) {
      return { width: height, height: width };
    }
    return { width, height };
  }

  // Check if a position collides with existing placements
  private checkCollision(x: number, y: number, width: number, height: number, excludeId?: string): boolean {
    for (const placement of this.placements) {
      if (excludeId && placement.partId === excludeId) continue;
      
      const aLeft = x;
      const aRight = x + width + this.kerfWidth;
      const aTop = y;
      const aBottom = y + height + this.kerfWidth;
      
      const bLeft = placement.x;
      const bRight = placement.x + placement.width + this.kerfWidth;
      const bTop = placement.y;
      const bBottom = placement.y + placement.height + this.kerfWidth;
      
      if (aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop) {
        return true;
      }
    }
    return false;
  }

  // Add a locked part first
  addLockedPart(part: Part): boolean {
    if (!part.isLocked || !part.lockedPosition) return false;
    
    const { x, y, rotation } = part.lockedPosition;
    const rotated = rotation === 90 || rotation === 270;
    const { width, height } = this.getBoundingBox(part, rotated);
    
    // Check bounds
    if (x + width > this.slabWidth || y + height > this.slabHeight || x < 0 || y < 0) {
      return false;
    }
    
    // Check collision with other locked parts
    if (this.checkCollision(x, y, width, height)) {
      return false;
    }
    
    this.placements.push({ x, y, width, height, partId: part.id });
    return true;
  }

  // Try to place a part using shelf algorithm
  tryPlace(part: Part): { x: number; y: number; rotation: number } | null {
    // Try both orientations if rotation is allowed
    const orientations = part.allowRotation ? [false, true] : [false];
    
    for (const rotated of orientations) {
      const { width, height } = this.getBoundingBox(part, rotated);
      
      // Skip if part doesn't fit slab at all
      if (width > this.slabWidth || height > this.slabHeight) continue;
      
      // First, try to find space using bottom-left placement
      const position = this.findBottomLeftPosition(width, height);
      if (position) {
        this.placements.push({ 
          x: position.x, 
          y: position.y, 
          width, 
          height, 
          partId: part.id 
        });
        return { 
          x: position.x, 
          y: position.y, 
          rotation: rotated ? 90 : 0 
        };
      }
    }
    
    return null;
  }

  // Bottom-left placement algorithm
  private findBottomLeftPosition(width: number, height: number): { x: number; y: number } | null {
    // Try positions in a grid pattern, preferring bottom-left
    const stepSize = Math.max(1, Math.floor(this.kerfWidth / 2)) || 10;
    
    for (let y = 0; y <= this.slabHeight - height; y += stepSize) {
      for (let x = 0; x <= this.slabWidth - width; x += stepSize) {
        if (!this.checkCollision(x, y, width, height)) {
          // Found a valid position, try to optimize it (move as far left and down as possible)
          let finalX = x;
          let finalY = y;
          
          // Move left
          while (finalX > 0 && !this.checkCollision(finalX - 1, finalY, width, height)) {
            finalX--;
          }
          
          // Move down
          while (finalY > 0 && !this.checkCollision(finalX, finalY - 1, width, height)) {
            finalY--;
          }
          
          return { x: finalX, y: finalY };
        }
      }
    }
    
    return null;
  }

  getUsedArea(): number {
    return this.placements.reduce((sum, p) => sum + p.width * p.height, 0);
  }
}

// Main nesting optimization function
function optimizeNesting(request: NestingRequest): NestingResult {
  const { parts, slabs, kerfWidth } = request;
  
  // Separate locked and unlocked parts
  const lockedParts = parts.filter(p => p.isLocked && p.lockedPosition);
  const unlockedParts = parts.filter(p => !p.isLocked || !p.lockedPosition);
  
  // Sort unlocked parts by area (largest first) for better packing
  const sortedParts = [...unlockedParts].sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    return areaB - areaA;
  });
  
  const placements: PlacedPart[] = [];
  const unplacedParts: string[] = [];
  const slabPackers: Map<string, ShelfPacker> = new Map();
  
  // Initialize packers for each slab
  for (const slab of slabs) {
    slabPackers.set(slab.id, new ShelfPacker(slab.width, slab.height, kerfWidth));
  }
  
  // First, place all locked parts on their assigned slabs
  for (const part of lockedParts) {
    const slabId = part.lockedPosition?.slabId || slabs[0]?.id;
    if (!slabId) continue;
    
    const packer = slabPackers.get(slabId);
    if (packer && packer.addLockedPart(part)) {
      const rotated = part.lockedPosition!.rotation === 90 || part.lockedPosition!.rotation === 270;
      const { width, height } = getPartDimensions(part, rotated);
      
      placements.push({
        partId: part.id,
        slabId,
        x: part.lockedPosition!.x,
        y: part.lockedPosition!.y,
        rotation: part.lockedPosition!.rotation,
        width,
        height,
      });
    } else {
      unplacedParts.push(part.id);
    }
  }
  
  // Then, place unlocked parts using the bin-packing algorithm
  for (const part of sortedParts) {
    let placed = false;
    
    // Try each slab in order
    for (const slab of slabs) {
      const packer = slabPackers.get(slab.id)!;
      const result = packer.tryPlace(part);
      
      if (result) {
        const rotated = result.rotation === 90 || result.rotation === 270;
        const { width, height } = getPartDimensions(part, rotated);
        
        placements.push({
          partId: part.id,
          slabId: slab.id,
          x: result.x,
          y: result.y,
          rotation: result.rotation,
          width,
          height,
        });
        placed = true;
        break;
      }
    }
    
    if (!placed) {
      unplacedParts.push(part.id);
    }
  }
  
  // Calculate slab usage statistics
  const slabUsage = slabs.map(slab => {
    const packer = slabPackers.get(slab.id)!;
    const usedArea = packer.getUsedArea();
    const totalArea = slab.width * slab.height;
    const wastePercentage = ((totalArea - usedArea) / totalArea) * 100;
    
    return {
      slabId: slab.id,
      usedArea,
      totalArea,
      wastePercentage,
    };
  });
  
  return { placements, unplacedParts, slabUsage };
}

function getPartDimensions(part: Part, rotated: boolean): { width: number; height: number } {
  let width = part.width;
  let height = part.height;
  
  if (part.shapeType === 'circle' && part.shapeData) {
    const circleData = part.shapeData as CircleData;
    width = height = circleData.radius * 2;
  } else if (part.shapeType === 'arc' && part.shapeData) {
    const arcData = part.shapeData as ArcData;
    width = height = arcData.radius * 2;
  }
  
  if (rotated) {
    return { width: height, height: width };
  }
  return { width, height };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: NestingRequest = await req.json();
    
    // Validate request
    if (!request.parts || !request.slabs || request.kerfWidth === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: parts, slabs, kerfWidth' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (request.slabs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one slab is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const result = optimizeNesting(request);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Nesting optimization error:', error);
    return new Response(
      JSON.stringify({ error: 'Optimization failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
