// Core types for the nesting/optimization system

export interface LShapeData {
  mainWidth: number;
  mainHeight: number;
  cutoutWidth: number;
  cutoutHeight: number;
  cutoutPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface CircleData {
  radius: number;
}

export interface ArcData {
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface CutoutData {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'sink' | 'hob' | 'custom';
}

export interface EdgeProfile {
  edge: 'top' | 'right' | 'bottom' | 'left';
  profile: 'raw' | 'polished' | 'bullnose' | 'bevel' | 'eased' | 'ogee' | 'waterfall';
}

export interface NestingPart {
  id: string;
  name: string;
  width: number;
  height: number;
  shapeType: 'rectangle' | 'l_shape' | 'circle' | 'arc';
  shapeData?: LShapeData | CircleData | ArcData;
  cutouts?: CutoutData[];
  edgeProfiles?: EdgeProfile[];
  allowRotation: boolean;
  isLocked: boolean;
  lockedPosition?: {
    slabId: string;
    x: number;
    y: number;
    rotation: number;
  };
}

export interface NestingSlab {
  id: string;
  name: string;
  width: number;
  height: number;
  stoneType: string;
  stoneName: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface PlacedPart {
  partId: string;
  slabId: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
}

export interface SlabUsage {
  slabId: string;
  usedArea: number;
  totalArea: number;
  wastePercentage: number;
}

export interface NestingResult {
  placements: PlacedPart[];
  unplacedParts: string[];
  slabUsage: SlabUsage[];
}

export interface NestingRequest {
  parts: NestingPart[];
  slabs: NestingSlab[];
  kerfWidth: number;
}

// Color palette for parts visualization
export const PART_COLORS = [
  'hsl(45, 93%, 47%)',   // Amber
  'hsl(200, 98%, 39%)',  // Blue
  'hsl(142, 71%, 45%)',  // Green
  'hsl(280, 87%, 55%)',  // Purple
  'hsl(350, 89%, 60%)',  // Red
  'hsl(180, 75%, 40%)',  // Teal
  'hsl(30, 100%, 50%)',  // Orange
  'hsl(320, 70%, 55%)',  // Pink
  'hsl(60, 90%, 45%)',   // Yellow
  'hsl(220, 70%, 50%)',  // Indigo
];

export function getPartColor(index: number): string {
  return PART_COLORS[index % PART_COLORS.length];
}
