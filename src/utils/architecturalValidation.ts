import { FloorPlanState } from '../types/floorplan';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'overlap' | 'boundary' | 'setback' | 'access' | 'circulation' | 'openings' | 'coverage' | 'fixtures';
  message: string;
  elements?: string[];
}

export interface FloorPlanValidationReport {
  isValid: boolean;
  score: number; // 0 to 100 architectural quality score
  summary: string;
  issues: ValidationIssue[];
  metrics: {
    plotArea: number;
    grossBuiltArea: number;
    outdoorLandscapeArea: number;
    trueBuiltCoverageRatio: number; // percentage
    maxAllowableCoverageRatio: number;
    roomCount: number;
    doorCount: number;
    windowCount: number;
    fixtureCount: number;
  };
}

export interface ConnectivityEdge {
  doorId: string;
  doorType: string;
  fromRoomId: string;
  fromRoomName: string;
  toRoomId: string;
  toRoomName: string;
  wall: string;
  isExterior: boolean;
}

export interface ConnectivityGraph {
  nodes: Array<{ id: string; name: string; type: string; area: number; isOutdoor: boolean }>;
  edges: ConnectivityEdge[];
  exteriorEntrances: string[];
  isolatedRooms: string[];
  reachableComponents: string[][];
}

const OUTDOOR_ZONE_TYPES = new Set([
  'parking',
  'garden',
  'courtyard',
  'patio',
  'balcony',
  'garage',
]);

export function isOutdoorZone(type: string): boolean {
  return OUTDOOR_ZONE_TYPES.has(type);
}

/**
 * Validates floor plan for architectural integrity, room overlaps,
 * plot boundaries, setbacks, circulation, and excessive openings.
 */
export function validateFloorplan(state: FloorPlanState): FloorPlanValidationReport {
  const issues: ValidationIssue[] = [];
  const { plot, rooms, openings, fixtures, metadata } = state;
  const plotArea = plot.width * plot.height;

  // 1. Coverage Breakdown: Distinguish Gross Built Area from Open/Outdoor Zones
  let grossBuiltArea = 0;
  let outdoorLandscapeArea = 0;

  for (const r of rooms) {
    const a = r.width * r.height;
    if (isOutdoorZone(r.type)) {
      outdoorLandscapeArea += a;
    } else {
      grossBuiltArea += a;
    }
  }

  const trueBuiltCoverageRatio = plotArea > 0 ? (grossBuiltArea / plotArea) * 100 : 0;
  const maxAllowableCoverageRatio = 50.0; // Standard urban/Abuja zoning limit

  if (trueBuiltCoverageRatio > maxAllowableCoverageRatio) {
    issues.push({
      severity: 'error',
      category: 'coverage',
      message: `Gross built coverage of ${trueBuiltCoverageRatio.toFixed(1)}% exceeds the maximum allowable zoning limit of ${maxAllowableCoverageRatio}%. (Outdoor landscaping/parking: ${outdoorLandscapeArea.toFixed(1)}m² is excluded).`,
    });
  } else {
    issues.push({
      severity: 'info',
      category: 'coverage',
      message: `Built footprint coverage is compliant at ${trueBuiltCoverageRatio.toFixed(1)}% of plot (Limit: ${maxAllowableCoverageRatio}%).`,
    });
  }

  // 2. Room Overlaps Check (2D Box Intersections)
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const r1 = rooms[i];
      const r2 = rooms[j];

      // AABB overlap check with 0.08m tolerance
      const xOverlap = Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x);
      const yOverlap = Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y);

      if (xOverlap > 0.08 && yOverlap > 0.08) {
        const overlapArea = (xOverlap * yOverlap).toFixed(2);
        issues.push({
          severity: 'error',
          category: 'overlap',
          message: `Spatial collision: "${r1.name}" overlaps with "${r2.name}" by ${overlapArea}m².`,
          elements: [r1.id, r2.id],
        });
      }
    }
  }

  // 3. Plot Boundaries Check
  for (const r of rooms) {
    if (r.x < -0.05 || r.y < -0.05 || r.x + r.width > plot.width + 0.05 || r.y + r.height > plot.height + 0.05) {
      issues.push({
        severity: 'error',
        category: 'boundary',
        message: `Zone "${r.name}" extends outside property plot boundaries (Plot: ${plot.width}m × ${plot.height}m).`,
        elements: [r.id],
      });
    }
  }

  // 4. Setbacks Compliance (Front: 6m, Rear: 3m, Sides: 3m default or custom metadata)
  const setbackFront = metadata?.setbacks?.north ?? plot.setbackNorth ?? 6.0;
  const setbackRear = metadata?.setbacks?.south ?? plot.setbackSouth ?? 3.0;
  const setbackEast = metadata?.setbacks?.east ?? plot.setbackEast ?? 3.0;
  const setbackWest = metadata?.setbacks?.west ?? plot.setbackWest ?? 3.0;

  for (const r of rooms) {
    // Only conditioned/built rooms must respect structural setbacks (parking/garden can be in setbacks)
    if (isOutdoorZone(r.type)) continue;

    if (r.y < setbackFront - 0.05) {
      issues.push({
        severity: 'warning',
        category: 'setback',
        message: `"${r.name}" encroaches into front setback line (at ${r.y.toFixed(2)}m from road; required: ${setbackFront}m).`,
        elements: [r.id],
      });
    }
    if (plot.height - (r.y + r.height) < setbackRear - 0.05) {
      issues.push({
        severity: 'warning',
        category: 'setback',
        message: `"${r.name}" encroaches into rear setback line (required: ${setbackRear}m).`,
        elements: [r.id],
      });
    }
    if (r.x < setbackWest - 0.05) {
      issues.push({
        severity: 'warning',
        category: 'setback',
        message: `"${r.name}" encroaches into west side setback (required: ${setbackWest}m).`,
        elements: [r.id],
      });
    }
    if (plot.width - (r.x + r.width) < setbackEast - 0.05) {
      issues.push({
        severity: 'warning',
        category: 'setback',
        message: `"${r.name}" encroaches into east side setback (required: ${setbackEast}m).`,
        elements: [r.id],
      });
    }
  }

  // 5. Circulation & Door Access Check
  const doors = openings.filter((o) => o.type.includes('door'));
  const windows = openings.filter((o) => o.type.includes('window'));

  for (const r of rooms) {
    if (isOutdoorZone(r.type)) continue;

    const roomDoors = doors.filter((d) => d.roomId === r.id);
    if (roomDoors.length === 0) {
      issues.push({
        severity: 'error',
        category: 'access',
        message: `Isolated space: "${r.name}" has 0 doors and cannot be entered.`,
        elements: [r.id],
      });
    }
  }

  // 6. Excessive Openings Check
  if (doors.length > rooms.length * 3.5) {
    issues.push({
      severity: 'warning',
      category: 'openings',
      message: `Abnormal door count: ${doors.length} doors for ${rooms.length} spaces. Redundant or stacked doors detected.`,
    });
  }

  // Wall-specific opening congestion check
  for (const r of rooms) {
    const rOpenings = openings.filter((o) => o.roomId === r.id);
    const wallBuckets: Record<string, number> = { north: 0, south: 0, east: 0, west: 0 };
    for (const op of rOpenings) {
      wallBuckets[op.wall] = (wallBuckets[op.wall] || 0) + op.width;
    }

    if (wallBuckets.north > r.width * 0.9) {
      issues.push({
        severity: 'warning',
        category: 'openings',
        message: `Openings on north wall of "${r.name}" exceed 90% of wall span.`,
        elements: [r.id],
      });
    }
    if (wallBuckets.south > r.width * 0.9) {
      issues.push({
        severity: 'warning',
        category: 'openings',
        message: `Openings on south wall of "${r.name}" exceed 90% of wall span.`,
        elements: [r.id],
      });
    }
    if (wallBuckets.east > r.height * 0.9) {
      issues.push({
        severity: 'warning',
        category: 'openings',
        message: `Openings on east wall of "${r.name}" exceed 90% of wall span.`,
        elements: [r.id],
      });
    }
    if (wallBuckets.west > r.height * 0.9) {
      issues.push({
        severity: 'warning',
        category: 'openings',
        message: `Openings on west wall of "${r.name}" exceed 90% of wall span.`,
        elements: [r.id],
      });
    }
  }

  // Calculate Score (100 base, -20 per error, -5 per warning)
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const score = Math.max(0, Math.min(100, 100 - errorCount * 20 - warningCount * 5));
  const isValid = errorCount === 0;

  let summary = `Floor plan validation score: ${score}/100. `;
  if (isValid) {
    summary += warningCount === 0
      ? 'Architecturally sound with zero errors or warnings.'
      : `Valid layout with ${warningCount} advisory warning(s).`;
  } else {
    summary += `Critical issues detected: ${errorCount} error(s) and ${warningCount} warning(s).`;
  }

  return {
    isValid,
    score,
    summary,
    issues,
    metrics: {
      plotArea,
      grossBuiltArea,
      outdoorLandscapeArea,
      trueBuiltCoverageRatio,
      maxAllowableCoverageRatio,
      roomCount: rooms.length,
      doorCount: doors.length,
      windowCount: windows.length,
      fixtureCount: fixtures.length,
    },
  };
}

/**
 * Builds a topological connectivity graph of rooms connected by doorways
 */
export function getConnectivityGraph(state: FloorPlanState): ConnectivityGraph {
  const { rooms, openings } = state;
  const doors = openings.filter((o) => o.type.includes('door'));

  const nodes = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    area: r.width * r.height,
    isOutdoor: isOutdoorZone(r.type),
  }));

  const edges: ConnectivityEdge[] = [];
  const exteriorEntrances: string[] = [];

  for (const door of doors) {
    const fromRoom = rooms.find((r) => r.id === door.roomId);
    if (!fromRoom) continue;

    // Calculate door world coordinate to find adjacent room
    let doorWorldX = fromRoom.x;
    let doorWorldY = fromRoom.y;

    if (door.wall === 'north') {
      doorWorldX += door.offset + door.width / 2;
      doorWorldY -= 0.15;
    } else if (door.wall === 'south') {
      doorWorldX += door.offset + door.width / 2;
      doorWorldY += fromRoom.height + 0.15;
    } else if (door.wall === 'west') {
      doorWorldX -= 0.15;
      doorWorldY += door.offset + door.width / 2;
    } else if (door.wall === 'east') {
      doorWorldX += fromRoom.width + 0.15;
      doorWorldY += door.offset + door.width / 2;
    }

    // Check if door enters another room
    const toRoom = rooms.find(
      (r) =>
        r.id !== fromRoom.id &&
        doorWorldX >= r.x - 0.2 &&
        doorWorldX <= r.x + r.width + 0.2 &&
        doorWorldY >= r.y - 0.2 &&
        doorWorldY <= r.y + r.height + 0.2
    );

    if (toRoom) {
      edges.push({
        doorId: door.id,
        doorType: door.type,
        fromRoomId: fromRoom.id,
        fromRoomName: fromRoom.name,
        toRoomId: toRoom.id,
        toRoomName: toRoom.name,
        wall: door.wall,
        isExterior: false,
      });
    } else {
      // Exterior door
      if (!exteriorEntrances.includes(fromRoom.id)) {
        exteriorEntrances.push(fromRoom.id);
      }
      edges.push({
        doorId: door.id,
        doorType: door.type,
        fromRoomId: fromRoom.id,
        fromRoomName: fromRoom.name,
        toRoomId: 'exterior',
        toRoomName: 'Exterior / Ground',
        wall: door.wall,
        isExterior: true,
      });
    }
  }

  // Find connected components (BFS)
  const adj: Record<string, string[]> = {};
  for (const r of rooms) adj[r.id] = [];
  for (const e of edges) {
    if (e.toRoomId !== 'exterior' && adj[e.fromRoomId] && adj[e.toRoomId]) {
      adj[e.fromRoomId].push(e.toRoomId);
      adj[e.toRoomId].push(e.fromRoomId);
    }
  }

  const visited = new Set<string>();
  const reachableComponents: string[][] = [];

  for (const r of rooms) {
    if (!visited.has(r.id)) {
      const comp: string[] = [];
      const queue = [r.id];
      visited.add(r.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);
        for (const neighbor of adj[curr] || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      reachableComponents.push(comp);
    }
  }

  const isolatedRooms = reachableComponents
    .filter((comp) => comp.length === 1)
    .map((comp) => {
      const r = rooms.find((x) => x.id === comp[0]);
      return r ? r.name : comp[0];
    });

  return {
    nodes,
    edges,
    exteriorEntrances: exteriorEntrances.map((id) => {
      const r = rooms.find((x) => x.id === id);
      return r ? r.name : id;
    }),
    isolatedRooms,
    reachableComponents,
  };
}
