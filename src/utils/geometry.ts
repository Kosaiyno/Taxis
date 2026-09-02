import { Room, Unit } from '../types/floorplan';

export const METERS_TO_FEET = 3.28084;
export const FEET_TO_METERS = 0.3048;

/**
 * Snap a value to a grid step (e.g. 0.1m / 10cm or 0.25m)
 */
export function snapToGrid(value: number, step: number = 0.25): number {
  return Math.round(value / step) * step;
}

/**
 * Format dimension in meters or feet with units
 */
export function formatDimension(meters: number, unit: Unit = 'm'): string {
  if (unit === 'ft') {
    const feet = meters * METERS_TO_FEET;
    return `${feet.toFixed(1)} ft`;
  }
  return `${meters.toFixed(2)} m`;
}

/**
 * Format area in square meters or square feet
 */
export function formatArea(squareMeters: number, unit: Unit = 'm'): string {
  if (unit === 'ft') {
    const sqFt = squareMeters * (METERS_TO_FEET * METERS_TO_FEET);
    return `${sqFt.toFixed(1)} sq ft`;
  }
  return `${squareMeters.toFixed(1)} m²`;
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Check if two rectangles overlap
 */
export function checkOverlap(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number },
  margin: number = 0
): boolean {
  return !(
    r1.x + r1.width + margin <= r2.x ||
    r2.x + r2.width + margin <= r1.x ||
    r1.y + r1.height + margin <= r2.y ||
    r2.y + r2.height + margin <= r1.y
  );
}

/**
 * Find the closest snapping alignment (edge-to-edge) with other rooms
 */
export function snapToAdjacentRooms(
  targetRoom: { x: number; y: number; width: number; height: number },
  otherRooms: Room[],
  threshold: number = 0.4
): { x: number; y: number; snappedX: boolean; snappedY: boolean } {
  let newX = targetRoom.x;
  let newY = targetRoom.y;
  let snappedX = false;
  let snappedY = false;

  for (const other of otherRooms) {
    // Snap target's left to other's right
    if (Math.abs(targetRoom.x - (other.x + other.width)) < threshold) {
      newX = other.x + other.width;
      snappedX = true;
    }
    // Snap target's right to other's left
    else if (Math.abs(targetRoom.x + targetRoom.width - other.x) < threshold) {
      newX = other.x - targetRoom.width;
      snappedX = true;
    }
    // Snap target's left to other's left
    else if (Math.abs(targetRoom.x - other.x) < threshold) {
      newX = other.x;
      snappedX = true;
    }
    // Snap target's right to other's right
    else if (Math.abs(targetRoom.x + targetRoom.width - (other.x + other.width)) < threshold) {
      newX = other.x + other.width - targetRoom.width;
      snappedX = true;
    }

    // Snap target's top to other's bottom
    if (Math.abs(targetRoom.y - (other.y + other.height)) < threshold) {
      newY = other.y + other.height;
      snappedY = true;
    }
    // Snap target's bottom to other's top
    else if (Math.abs(targetRoom.y + targetRoom.height - other.y) < threshold) {
      newY = other.y - targetRoom.height;
      snappedY = true;
    }
    // Snap target's top to other's top
    else if (Math.abs(targetRoom.y - other.y) < threshold) {
      newY = other.y;
      snappedY = true;
    }
    // Snap target's bottom to other's bottom
    else if (Math.abs(targetRoom.y + targetRoom.height - (other.y + other.height)) < threshold) {
      newY = other.y + other.height - targetRoom.height;
      snappedY = true;
    }
  }

  return { x: newX, y: newY, snappedX, snappedY };
}
