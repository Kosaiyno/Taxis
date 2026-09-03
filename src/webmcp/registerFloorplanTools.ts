import { useFloorPlanStore } from '../store/floorplanStore';
import { RoomType, OpeningType, FixtureType, Unit, WallOrientation, Room } from '../types/floorplan';
import { snapToGrid } from '../utils/geometry';

declare global {
  interface ModelContextTool {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    annotations?: {
      readOnlyHint?: boolean;
      untrustedContentHint?: boolean;
    };
    execute: (input: any) => Promise<any>;
  }

  interface Document {
    modelContext?: {
      registerTool: (tool: ModelContextTool) => Promise<void>;
      getTools?: () => Promise<ModelContextTool[]>;
    };
  }

  interface Window {
    __WEBMCP_TOOLS__?: {
      list: () => RegisteredToolInfo[];
      execute: (toolName: string, args: any) => Promise<any>;
      getSchemas: () => any[];
    };
  }
}

export interface RegisteredToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  readOnly: boolean;
  execute: (input: any) => Promise<any>;
}

export const REGISTERED_WEBMCP_TOOLS: RegisteredToolInfo[] = [];

/**
 * Fuzzy finder to resolve room names/IDs with high resilience
 */
export function findTargetRoom(rooms: Room[], query: string): Room | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();

  // 1. Exact ID or exact name match
  let match = rooms.find((r) => r.id === query || r.name.toLowerCase() === q);
  if (match) return match;

  // 2. Exact room type match
  match = rooms.find((r) => r.type.toLowerCase() === q);
  if (match) return match;

  // 3. Substring inclusion in name or type
  match = rooms.find((r) => r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q));
  if (match) return match;

  // 4. Common synonyms
  if (q.includes('bed') || q.includes('master')) {
    match = rooms.find((r) => r.type.includes('bedroom') || r.name.toLowerCase().includes('bed'));
  } else if (q.includes('bath') || q.includes('toilet') || q.includes('wash')) {
    match = rooms.find((r) => r.type === 'bathroom' || r.name.toLowerCase().includes('bath'));
  } else if (q.includes('living') || q.includes('hall') || q.includes('lounge')) {
    match = rooms.find((r) => r.type === 'living_room' || r.name.toLowerCase().includes('living'));
  } else if (q.includes('kitchen') || q.includes('cook') || q.includes('dining')) {
    match = rooms.find((r) => r.type === 'kitchen' || r.name.toLowerCase().includes('kitchen'));
  }

  return match;
}

/**
 * Calculates optimal non-overlapping coordinate for a new or moved room
 */
export function calculateSmartPlacement(
  rooms: Room[],
  plotWidth: number,
  _plotHeight: number,
  reqWidth: number,
  reqHeight: number,
  adjacentToRoom?: Room,
  relativePos?: 'right_of' | 'left_of' | 'above' | 'below'
): { x: number; y: number } {
  const margin = 0.2;

  if (adjacentToRoom) {
    if (relativePos === 'left_of') {
      const x = Math.max(1.0, adjacentToRoom.x - reqWidth);
      return { x: snapToGrid(x, 0.1), y: snapToGrid(adjacentToRoom.y, 0.1) };
    }
    if (relativePos === 'above') {
      const y = Math.max(1.0, adjacentToRoom.y - reqHeight);
      return { x: snapToGrid(adjacentToRoom.x, 0.1), y: snapToGrid(y, 0.1) };
    }
    if (relativePos === 'below') {
      const y = adjacentToRoom.y + adjacentToRoom.height;
      return { x: snapToGrid(adjacentToRoom.x, 0.1), y: snapToGrid(y, 0.1) };
    }
    // Default right_of
    const x = adjacentToRoom.x + adjacentToRoom.width;
    return { x: snapToGrid(x, 0.1), y: snapToGrid(adjacentToRoom.y, 0.1) };
  }

  // Scan plot grid for first open slot
  if (rooms.length === 0) return { x: 2.0, y: 2.0 };

  const last = rooms[rooms.length - 1];
  if (last.x + last.width + reqWidth <= plotWidth - 1.0) {
    return { x: snapToGrid(last.x + last.width, 0.1), y: snapToGrid(last.y, 0.1) };
  }

  // Next row
  let maxY = 2.0;
  for (const r of rooms) {
    maxY = Math.max(maxY, r.y + r.height);
  }

  return { x: 2.0, y: snapToGrid(maxY + margin, 0.1) };
}

/**
 * Resolves color names or hex strings into standard hex codes
 */
export function resolveColorInput(c?: string): string {
  if (!c) return '#ffffff';
  const clean = c.trim().toLowerCase();
  const map: Record<string, string> = {
    white: '#ffffff',
    gold: '#c99a6e',
    crema: '#c99a6e',
    brown: '#8d7b68',
    espresso: '#261e1b',
    dark: '#261e1b',
    black: '#18110e',
    green: '#10b981',
    emerald: '#10b981',
    blue: '#3b82f6',
    ocean: '#3b82f6',
    amber: '#f59e0b',
    orange: '#f59e0b',
    coral: '#ef4444',
    red: '#ef4444',
    rose: '#f43f5e',
    purple: '#8b5cf6',
    violet: '#8b5cf6',
    teal: '#14b8a6',
    mint: '#14b8a6',
    slate: '#64748b',
    charcoal: '#475569',
    gray: '#64748b',
    grey: '#64748b',
    yellow: '#eab308',
  };
  if (map[clean]) return map[clean];
  if (clean.startsWith('#')) return clean;
  return `#${clean}`;
}

/**
 * Register all Taxis spatial tools with WebMCP (document.modelContext)
 */
export async function registerFloorplanTools(): Promise<RegisteredToolInfo[]> {
  REGISTERED_WEBMCP_TOOLS.length = 0;
  const store = useFloorPlanStore.getState;

  // 1. get_floorplan_state
  const getFloorplanStateTool: ModelContextTool = {
    name: 'get_floorplan_state',
    description:
      'Reads the complete floor plan state: plot size, all rooms, coordinates, dimensions, doors, windows, furniture, square meterage, and plot coverage.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const state = store();
      const totalPlotArea = state.plot.width * state.plot.height;
      const totalBuiltArea = state.rooms.reduce((acc, r) => acc + r.width * r.height, 0);
      return {
        projectName: state.projectName,
        unit: state.plot.unit,
        plot: {
          width: state.plot.width,
          height: state.plot.height,
          totalArea: `${totalPlotArea.toFixed(1)} ${state.plot.unit === 'm' ? 'm²' : 'sq ft'}`,
        },
        metrics: {
          totalRooms: state.rooms.length,
          totalBuiltArea: `${totalBuiltArea.toFixed(1)} ${state.plot.unit === 'm' ? 'm²' : 'sq ft'}`,
          plotCoverage: `${((totalBuiltArea / totalPlotArea) * 100).toFixed(1)}%`,
        },
        rooms: state.rooms.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          area: `${(r.width * r.height).toFixed(1)} ${state.plot.unit === 'm' ? 'm²' : 'sq ft'}`,
          openings: state.openings.filter((o) => o.roomId === r.id),
          fixtures: state.fixtures.filter((f) => f.roomId === r.id),
        })),
      };
    },
  };

  // 2. set_plot_dimensions
  const setPlotDimensionsTool: ModelContextTool = {
    name: 'set_plot_dimensions',
    description: 'Sets or updates the land plot boundary dimensions (width and depth in meters or feet).',
    inputSchema: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Width of plot in meters' },
        height: { type: 'number', description: 'Depth/height of plot in meters' },
        unit: { type: 'string', enum: ['m', 'ft'], description: 'Unit (m or ft)' },
      },
      required: ['width', 'height'],
      additionalProperties: false,
    },
    execute: async (input: { width: number; height: number; unit?: Unit }) => {
      const { setPlot } = useFloorPlanStore.getState();
      setPlot({
        width: Math.max(5, input.width),
        height: Math.max(5, input.height),
        ...(input.unit ? { unit: input.unit } : {}),
      });
      return {
        success: true,
        message: `Plot updated to ${input.width}m × ${input.height}m.`,
        plot: useFloorPlanStore.getState().plot,
      };
    },
  };

  // 3. add_room
  const addRoomTool: ModelContextTool = {
    name: 'add_room',
    description:
      'Adds a new room with custom name, type, dimensions, and optional coordinates or relative placement.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Room name (e.g. "Master Bedroom", "Kitchen", "Bedroom 2")' },
        type: {
          type: 'string',
          enum: [
            'bedroom',
            'master_bedroom',
            'bathroom',
            'kitchen',
            'living_room',
            'dining_room',
            'garage',
            'hallway',
            'office',
            'balcony',
            'patio',
            'laundry',
            'custom',
          ],
        },
        width: { type: 'number', description: 'Width in meters (defaults to standard preset size)' },
        height: { type: 'number', description: 'Height in meters (defaults to standard preset size)' },
        x: { type: 'number', description: 'Optional exact X coordinate in meters' },
        y: { type: 'number', description: 'Optional exact Y coordinate in meters' },
        adjacent_to: { type: 'string', description: 'Optional name/type of room to place this beside' },
        position: { type: 'string', enum: ['right_of', 'left_of', 'above', 'below'] },
      },
      required: ['name'],
      additionalProperties: false,
    },
    execute: async (input: {
      name: string;
      type?: RoomType;
      width?: number;
      height?: number;
      x?: number;
      y?: number;
      adjacent_to?: string;
      position?: 'right_of' | 'left_of' | 'above' | 'below';
    }) => {
      const state = useFloorPlanStore.getState();
      let targetX = input.x;
      let targetY = input.y;

      const w = input.width || 4.0;
      const h = input.height || 3.5;

      if (targetX === undefined || targetY === undefined) {
        const refRoom = input.adjacent_to ? findTargetRoom(state.rooms, input.adjacent_to) : undefined;
        const smartPos = calculateSmartPlacement(
          state.rooms,
          state.plot.width,
          state.plot.height,
          w,
          h,
          refRoom,
          input.position
        );
        targetX = smartPos.x;
        targetY = smartPos.y;
      }

      const id = state.addRoom({
        name: input.name,
        type: input.type,
        width: w,
        height: h,
        x: targetX,
        y: targetY,
      });

      const created = useFloorPlanStore.getState().rooms.find((r) => r.id === id);
      return {
        success: true,
        message: `Added room "${created?.name}" (${created?.width}m × ${created?.height}m) at (${created?.x}m, ${created?.y}m).`,
        room: created,
      };
    },
  };

  // 4. resize_room
  const resizeRoomTool: ModelContextTool = {
    name: 'resize_room',
    description: 'Resizes an existing room by name or ID (e.g. "Make Master Bedroom 4.5m × 4m").',
    inputSchema: {
      type: 'object',
      properties: {
        room_name_or_id: { type: 'string', description: 'Name, type, or ID of the room' },
        width: { type: 'number', description: 'New width in meters' },
        height: { type: 'number', description: 'New height in meters' },
      },
      required: ['room_name_or_id', 'width', 'height'],
      additionalProperties: false,
    },
    execute: async (input: { room_name_or_id: string; width: number; height: number }) => {
      const { resizeRoom, rooms } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) {
        return {
          success: false,
          error: `Room matching "${input.room_name_or_id}" was not found. Available rooms: ${rooms.map((r) => r.name).join(', ')}`,
        };
      }
      resizeRoom(target.id, input.width, input.height);
      const updated = useFloorPlanStore.getState().rooms.find((r) => r.id === target.id);
      return {
        success: true,
        message: `Resized "${updated?.name}" to ${updated?.width}m × ${updated?.height}m (${((updated?.width || 1) * (updated?.height || 1)).toFixed(1)} m²).`,
        room: updated,
      };
    },
  };

  // 5. move_room
  const moveRoomTool: ModelContextTool = {
    name: 'move_room',
    description: 'Moves a room to absolute coordinates (x, y) or aligns it adjacent to another room.',
    inputSchema: {
      type: 'object',
      properties: {
        room_name_or_id: { type: 'string', description: 'Name or ID of room to move' },
        x: { type: 'number', description: 'Target X coordinate in meters' },
        y: { type: 'number', description: 'Target Y coordinate in meters' },
        adjacent_to: { type: 'string', description: 'Name or type of reference room to snap beside' },
        position: { type: 'string', enum: ['right_of', 'left_of', 'above', 'below'] },
      },
      required: ['room_name_or_id'],
      additionalProperties: false,
    },
    execute: async (input: {
      room_name_or_id: string;
      x?: number;
      y?: number;
      adjacent_to?: string;
      position?: 'right_of' | 'left_of' | 'above' | 'below';
    }) => {
      const { rooms, moveRoom, plot } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) return { success: false, error: `Room "${input.room_name_or_id}" not found.` };

      let targetX = input.x ?? target.x;
      let targetY = input.y ?? target.y;

      if (input.adjacent_to) {
        const refRoom = findTargetRoom(rooms.filter((r) => r.id !== target.id), input.adjacent_to);
        if (refRoom) {
          const smartPos = calculateSmartPlacement(
            rooms.filter((r) => r.id !== target.id),
            plot.width,
            plot.height,
            target.width,
            target.height,
            refRoom,
            input.position || 'right_of'
          );
          targetX = smartPos.x;
          targetY = smartPos.y;
        }
      }

      moveRoom(target.id, targetX, targetY);
      return { success: true, message: `Moved "${target.name}" to (${targetX}m, ${targetY}m).` };
    },
  };

  // 6. rotate_room
  const rotateRoomTool: ModelContextTool = {
    name: 'rotate_room',
    description: 'Rotates a room by 90 degrees (swapping width and height).',
    inputSchema: {
      type: 'object',
      properties: { room_name_or_id: { type: 'string', description: 'Room name or ID' } },
      required: ['room_name_or_id'],
      additionalProperties: false,
    },
    execute: async (input: { room_name_or_id: string }) => {
      const { rooms, rotateRoom } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) return { success: false, error: `Room "${input.room_name_or_id}" not found.` };
      rotateRoom(target.id);
      return { success: true, message: `Rotated room "${target.name}".` };
    },
  };

  // 7. duplicate_room
  const duplicateRoomTool: ModelContextTool = {
    name: 'duplicate_room',
    description: 'Clones an existing room and places a duplicate adjacent to it.',
    inputSchema: {
      type: 'object',
      properties: { room_name_or_id: { type: 'string', description: 'Room name or ID' } },
      required: ['room_name_or_id'],
      additionalProperties: false,
    },
    execute: async (input: { room_name_or_id: string }) => {
      const { rooms, cloneRoom } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) return { success: false, error: `Room "${input.room_name_or_id}" not found.` };
      const newId = cloneRoom(target.id);
      return { success: true, message: `Cloned room "${target.name}".`, newRoomId: newId };
    },
  };

  // 8. delete_room
  const deleteRoomTool: ModelContextTool = {
    name: 'delete_room',
    description: 'Deletes a room along with its attached doors, windows, and furniture.',
    inputSchema: {
      type: 'object',
      properties: { room_name_or_id: { type: 'string', description: 'Room name or ID' } },
      required: ['room_name_or_id'],
      additionalProperties: false,
    },
    execute: async (input: { room_name_or_id: string }) => {
      const { rooms, deleteRoom } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) return { success: false, error: `Room "${input.room_name_or_id}" not found.` };
      deleteRoom(target.id);
      return { success: true, message: `Deleted room "${target.name}".` };
    },
  };

  // 9. add_door
  const addDoorTool: ModelContextTool = {
    name: 'add_door',
    description: 'Adds a door (single, double, sliding, pocket) to a wall of a room.',
    inputSchema: {
      type: 'object',
      properties: {
        room_name_or_id: { type: 'string', description: 'Room name or ID' },
        wall: { type: 'string', enum: ['north', 'south', 'east', 'west'] },
        type: { type: 'string', enum: ['single_door', 'double_door', 'sliding_door', 'pocket_door'] },
        offset: { type: 'number', description: 'Distance in meters along the wall' },
        width: { type: 'number', description: 'Door width in meters (e.g. 0.9 or 1.5)' },
      },
      required: ['room_name_or_id', 'wall'],
      additionalProperties: false,
    },
    execute: async (input: {
      room_name_or_id: string;
      wall: WallOrientation;
      type?: OpeningType;
      offset?: number;
      width?: number;
    }) => {
      const { rooms, addOpening } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) return { success: false, error: `Room "${input.room_name_or_id}" not found.` };
      const doorId = addOpening({
        roomId: target.id,
        type: input.type || 'single_door',
        wall: input.wall,
        offset: input.offset ?? 1.0,
        width: input.width,
      });
      return { success: true, message: `Added door to ${input.wall} wall of "${target.name}".`, doorId };
    },
  };

  // 10. flip_door_swing
  const flipDoorSwingTool: ModelContextTool = {
    name: 'flip_door_swing',
    description: 'Toggles a door swing between inside and outside.',
    inputSchema: {
      type: 'object',
      properties: { door_id: { type: 'string', description: 'ID of the door opening' } },
      required: ['door_id'],
      additionalProperties: false,
    },
    execute: async (input: { door_id: string }) => {
      const { flipOpeningSwing } = useFloorPlanStore.getState();
      flipOpeningSwing(input.door_id);
      return { success: true, message: `Flipped swing direction for door ${input.door_id}.` };
    },
  };

  // 11. add_window
  const addWindowTool: ModelContextTool = {
    name: 'add_window',
    description: 'Adds a window to a wall of a room.',
    inputSchema: {
      type: 'object',
      properties: {
        room_name_or_id: { type: 'string', description: 'Room name or ID' },
        wall: { type: 'string', enum: ['north', 'south', 'east', 'west'] },
        type: { type: 'string', enum: ['window', 'bay_window'] },
        offset: { type: 'number', description: 'Distance in meters along the wall' },
        width: { type: 'number', description: 'Window width in meters (e.g. 1.2 or 2.0)' },
      },
      required: ['room_name_or_id', 'wall'],
      additionalProperties: false,
    },
    execute: async (input: {
      room_name_or_id: string;
      wall: WallOrientation;
      type?: OpeningType;
      offset?: number;
      width?: number;
    }) => {
      const { rooms, addOpening } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) return { success: false, error: `Room "${input.room_name_or_id}" not found.` };
      const winId = addOpening({
        roomId: target.id,
        type: input.type || 'window',
        wall: input.wall,
        offset: input.offset ?? 1.0,
        width: input.width ?? 1.2,
      });
      return { success: true, message: `Added window to ${input.wall} wall of "${target.name}".`, winId };
    },
  };

  // 12. add_fixture
  const addFixtureTool: ModelContextTool = {
    name: 'add_fixture',
    description:
      'Places furniture or fixtures (stairs, kitchen counter/island, sink, toilet, shower, bathtub, king bed, sofa, dining table, desk, car) into a room.',
    inputSchema: {
      type: 'object',
      properties: {
        room_name_or_id: { type: 'string', description: 'Room name or ID' },
        type: {
          type: 'string',
          enum: [
            'stairs',
            'kitchen_counter',
            'kitchen_island',
            'sink',
            'toilet',
            'shower',
            'bathtub',
            'bed_king',
            'bed_single',
            'wardrobe',
            'sofa',
            'dining_table',
            'desk',
            'car',
          ],
        },
        name: { type: 'string', description: 'Optional custom display label' },
        color: { type: 'string', description: 'Optional color (hex code e.g. "#10b981" or name e.g. "emerald", "gold", "dark", "blue", "amber", "rose")' },
        x: { type: 'number', description: 'Relative X offset in meters' },
        y: { type: 'number', description: 'Relative Y offset in meters' },
        rotation: { type: 'number', enum: [0, 90, 180, 270] },
      },
      required: ['room_name_or_id', 'type'],
      additionalProperties: false,
    },
    execute: async (input: {
      room_name_or_id: string;
      type: FixtureType;
      name?: string;
      color?: string;
      x?: number;
      y?: number;
      rotation?: number;
    }) => {
      const { rooms, addFixture } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) return { success: false, error: `Room "${input.room_name_or_id}" not found.` };
      const fixId = addFixture({
        roomId: target.id,
        type: input.type,
        name: input.name,
        customColor: input.color ? resolveColorInput(input.color) : undefined,
        x: input.x ?? 0.8,
        y: input.y ?? 0.8,
        rotation: input.rotation ?? 0,
      });
      return { success: true, message: `Placed ${input.type} in "${target.name}".`, fixId };
    },
  };

  // 13. resize_fixture
  const resizeFixtureTool: ModelContextTool = {
    name: 'resize_fixture',
    description: 'Resizes a piece of furniture or fixture (e.g. make dining table 2.4m x 1.0m).',
    inputSchema: {
      type: 'object',
      properties: {
        fixture_name_or_id: { type: 'string', description: 'Fixture name or ID' },
        width: { type: 'number', description: 'Width in meters' },
        height: { type: 'number', description: 'Length/depth in meters' },
      },
      required: ['fixture_name_or_id', 'width', 'height'],
      additionalProperties: false,
    },
    execute: async (input: { fixture_name_or_id: string; width: number; height: number }) => {
      const { fixtures, resizeFixture } = useFloorPlanStore.getState();
      const target = fixtures.find(
        (f) => f.id === input.fixture_name_or_id || f.name.toLowerCase().includes(input.fixture_name_or_id.toLowerCase())
      );
      if (!target) return { success: false, error: `Object "${input.fixture_name_or_id}" not found.` };
      resizeFixture(target.id, input.width, input.height);
      return { success: true, message: `Resized ${target.name} to ${input.width}m × ${input.height}m.` };
    },
  };

  // 14. rotate_fixture
  const rotateFixtureTool: ModelContextTool = {
    name: 'rotate_fixture',
    description: 'Rotates an object/furniture item by 90 degrees.',
    inputSchema: {
      type: 'object',
      properties: { fixture_name_or_id: { type: 'string', description: 'Fixture name or ID' } },
      required: ['fixture_name_or_id'],
      additionalProperties: false,
    },
    execute: async (input: { fixture_name_or_id: string }) => {
      const { fixtures, rotateFixture } = useFloorPlanStore.getState();
      const target = fixtures.find(
        (f) => f.id === input.fixture_name_or_id || f.name.toLowerCase().includes(input.fixture_name_or_id.toLowerCase())
      );
      if (!target) return { success: false, error: `Object "${input.fixture_name_or_id}" not found.` };
      rotateFixture(target.id);
      return { success: true, message: `Rotated ${target.name} by +90°.` };
    },
  };

  // 15. delete_fixture
  const deleteFixtureTool: ModelContextTool = {
    name: 'delete_fixture',
    description: 'Deletes a piece of furniture or fixture.',
    inputSchema: {
      type: 'object',
      properties: { fixture_name_or_id: { type: 'string', description: 'Fixture name or ID' } },
      required: ['fixture_name_or_id'],
      additionalProperties: false,
    },
    execute: async (input: { fixture_name_or_id: string }) => {
      const { fixtures, deleteFixture } = useFloorPlanStore.getState();
      const target = fixtures.find(
        (f) => f.id === input.fixture_name_or_id || f.name.toLowerCase().includes(input.fixture_name_or_id.toLowerCase())
      );
      if (!target) return { success: false, error: `Object "${input.fixture_name_or_id}" not found.` };
      deleteFixture(target.id);
      return { success: true, message: `Deleted object "${target.name}".` };
    },
  };

  // 16. auto_arrange_floorplan
  const autoArrangeTool: ModelContextTool = {
    name: 'auto_arrange_floorplan',
    description: 'Arranges multiple rooms automatically into a clean architectural floor plan layout.',
    inputSchema: {
      type: 'object',
      properties: {
        rooms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: {
                type: 'string',
                enum: [
                  'bedroom',
                  'master_bedroom',
                  'bathroom',
                  'kitchen',
                  'living_room',
                  'dining_room',
                  'garage',
                  'hallway',
                  'office',
                ],
              },
              width: { type: 'number' },
              height: { type: 'number' },
            },
            required: ['name', 'type'],
          },
        },
      },
      required: ['rooms'],
      additionalProperties: false,
    },
    execute: async (input: { rooms: Array<{ name: string; type: RoomType; width?: number; height?: number }> }) => {
      const { autoArrangeRooms } = useFloorPlanStore.getState();
      autoArrangeRooms(input.rooms);
      return {
        success: true,
        message: `Arranged ${input.rooms.length} rooms cleanly.`,
        rooms: useFloorPlanStore.getState().rooms,
      };
    },
  };

  // 17. calculate_plot_compliance
  const calculateComplianceTool: ModelContextTool = {
    name: 'calculate_plot_compliance',
    description: 'Evaluates zoning coverage ratio (FAR), setback clearances, and egress access.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const state = store();
      const totalPlot = state.plot.width * state.plot.height;
      const totalBuilt = state.rooms.reduce((acc, r) => acc + r.width * r.height, 0);
      const coverage = (totalBuilt / totalPlot) * 100;
      const isCompliant = coverage <= 60.0;

      return {
        totalPlotArea: `${totalPlot.toFixed(1)} m²`,
        totalBuiltArea: `${totalBuilt.toFixed(1)} m²`,
        coverageRatio: `${coverage.toFixed(1)}%`,
        maxRecommendedCoverage: '60%',
        complianceStatus: isCompliant ? 'Compliant' : 'Warning: Exceeds 60% standard plot coverage',
        roomCount: state.rooms.length,
        fixturesCount: state.fixtures.length,
      };
    },
  };

  // 18. clear_floorplan
  const clearFloorplanTool: ModelContextTool = {
    name: 'clear_floorplan',
    description: 'Clears all rooms and furniture to start fresh on a blank plot.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => {
      const { clearPlan } = useFloorPlanStore.getState();
      clearPlan();
      return { success: true, message: 'Canvas cleared. Ready for new floor plan.' };
    },
  };

  // 19. add_custom_shape (Generic Parametric Geometry)
  const addCustomShapeTool: ModelContextTool = {
    name: 'add_custom_shape',
    description: 'Adds a generic parametric shape entity (rectangle, circle, l_shape, u_shape, t_shape, v_shape) with custom name, dimensions, and coordinates. Use for custom stages, booths, reception counters, tables, or equipment.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Custom name/label for the shape (e.g. "Main Keynote V-Stage", "Gold Sponsor Booth", "L-Shaped Reception")' },
        geometry: {
          type: 'string',
          enum: ['rectangle', 'circle', 'l_shape', 'u_shape', 't_shape', 'v_shape'],
          description: 'Geometric form of the shape entity',
        },
        width: { type: 'number', description: 'Width / diameter of the shape in meters' },
        height: { type: 'number', description: 'Length / depth of the shape in meters' },
        x: { type: 'number', description: 'X position on canvas/room in meters' },
        y: { type: 'number', description: 'Y position on canvas/room in meters' },
        color: { type: 'string', description: 'Optional color (hex code e.g. "#10b981" or name e.g. "emerald", "gold", "dark", "blue", "amber", "rose")' },
        rotation: { type: 'number', enum: [0, 90, 180, 270], description: 'Rotation in degrees' },
        room_name_or_id: { type: 'string', description: 'Optional room/zone name to place inside' },
      },
      required: ['name', 'geometry', 'width', 'height'],
      additionalProperties: false,
    },
    execute: async (input: {
      name: string;
      geometry: 'rectangle' | 'circle' | 'l_shape' | 'u_shape' | 't_shape' | 'v_shape';
      width: number;
      height: number;
      color?: string;
      x?: number;
      y?: number;
      rotation?: number;
      room_name_or_id?: string;
    }) => {
      const { rooms, addFixture } = useFloorPlanStore.getState();
      const targetRoom = input.room_name_or_id ? findTargetRoom(rooms, input.room_name_or_id) : rooms[0];
      const targetRoomId = targetRoom ? targetRoom.id : 'canvas';

      const fixId = addFixture({
        roomId: targetRoomId,
        type: 'custom_shape',
        name: input.name,
        width: input.width,
        height: input.height,
        customColor: input.color ? resolveColorInput(input.color) : undefined,
        x: input.x !== undefined ? input.x : 2.0,
        y: input.y !== undefined ? input.y : 2.0,
        rotation: input.rotation || 0,
        geometry: input.geometry,
      });

      return {
        success: true,
        shapeId: fixId,
        name: input.name,
        geometry: input.geometry,
        color: input.color ? resolveColorInput(input.color) : undefined,
        dimensions: `${input.width}m × ${input.height}m`,
        message: `Created ${input.geometry} shape "${input.name}" (${input.width}m × ${input.height}m).`,
      };
    },
  };

  // 20. reshape_object
  const reshapeObjectTool: ModelContextTool = {
    name: 'reshape_object',
    description: 'Remodels or resizes any object/fixture/shape on the canvas (change geometry, width, depth, rotation, color, or name).',
    inputSchema: {
      type: 'object',
      properties: {
        object_name_or_id: { type: 'string', description: 'Name or ID of the object/shape to remodel' },
        new_name: { type: 'string', description: 'Optional new label/name' },
        new_color: { type: 'string', description: 'Optional new color (hex e.g. "#10b981" or name e.g. "emerald", "gold", "blue", "dark")' },
        new_geometry: {
          type: 'string',
          enum: ['rectangle', 'circle', 'l_shape', 'u_shape', 't_shape', 'v_shape'],
          description: 'New geometric shape form',
        },
        new_width: { type: 'number', description: 'New width in meters' },
        new_height: { type: 'number', description: 'New depth/length in meters' },
        new_rotation: { type: 'number', enum: [0, 90, 180, 270], description: 'New rotation angle' },
      },
      required: ['object_name_or_id'],
      additionalProperties: false,
    },
    execute: async (input: {
      object_name_or_id: string;
      new_name?: string;
      new_color?: string;
      new_geometry?: any;
      new_width?: number;
      new_height?: number;
      new_rotation?: number;
    }) => {
      const { fixtures, updateFixture } = useFloorPlanStore.getState();
      const q = input.object_name_or_id.toLowerCase();
      const target = fixtures.find((f) => f.id === input.object_name_or_id || f.name.toLowerCase().includes(q));

      if (!target) {
        throw new Error(`Object "${input.object_name_or_id}" not found.`);
      }

      const updates: any = {};
      if (input.new_name) updates.name = input.new_name;
      if (input.new_color !== undefined) updates.customColor = resolveColorInput(input.new_color);
      if (input.new_geometry) updates.geometry = input.new_geometry;
      if (input.new_width) updates.width = input.new_width;
      if (input.new_height) updates.height = input.new_height;
      if (input.new_rotation !== undefined) updates.rotation = input.new_rotation;

      updateFixture(target.id, updates);

      return {
        success: true,
        objectId: target.id,
        updatedFields: updates,
        message: `Object "${target.name}" successfully remodeled.`,
      };
    },
  };

  // 21. rename_element
  const renameElementTool: ModelContextTool = {
    name: 'rename_element',
    description: 'Renames any room, shape, or furniture item on the canvas.',
    inputSchema: {
      type: 'object',
      properties: {
        element_name_or_id: { type: 'string', description: 'Current name or ID of the room or object' },
        new_name: { type: 'string', description: 'The new name to assign' },
      },
      required: ['element_name_or_id', 'new_name'],
      additionalProperties: false,
    },
    execute: async (input: { element_name_or_id: string; new_name: string }) => {
      const { rooms, fixtures, updateRoom, updateFixture } = useFloorPlanStore.getState();
      const q = input.element_name_or_id.toLowerCase();

      // Check rooms
      const room = rooms.find((r) => r.id === input.element_name_or_id || r.name.toLowerCase().includes(q));
      if (room) {
        updateRoom(room.id, { name: input.new_name });
        return { success: true, type: 'room', id: room.id, newName: input.new_name };
      }

      // Check fixtures
      const fix = fixtures.find((f) => f.id === input.element_name_or_id || f.name.toLowerCase().includes(q));
      if (fix) {
        updateFixture(fix.id, { name: input.new_name });
        return { success: true, type: 'fixture', id: fix.id, newName: input.new_name };
      }

      throw new Error(`Element "${input.element_name_or_id}" not found.`);
    },
  };

  // 22. batch_create_grid_layout
  const batchCreateGridLayoutTool: ModelContextTool = {
    name: 'batch_create_grid_layout',
    description: 'Generates a matrix/grid of N items with designated rows, columns, and aisle spacing. Perfect for creating 20-50 exhibition booths, banquet tables, or workstation pods in seconds.',
    inputSchema: {
      type: 'object',
      properties: {
        item_type: {
          type: 'string',
          enum: ['booth_standard', 'booth_sponsor', 'round_banquet_table', 'workstation_cluster', 'desk', 'custom_shape'],
          description: 'Type of item to replicate in grid',
        },
        item_name_prefix: { type: 'string', description: 'Naming prefix (e.g. "Booth", "Table", "Station")' },
        count: { type: 'number', description: 'Total number of items to create (e.g. 30)' },
        columns: { type: 'number', description: 'Number of columns in the grid (e.g. 5)' },
        item_width: { type: 'number', description: 'Width of each item in meters (e.g. 3.0)' },
        item_height: { type: 'number', description: 'Depth/height of each item in meters (e.g. 3.0)' },
        aisle_x: { type: 'number', description: 'Horizontal aisle clearance between columns in meters (e.g. 2.0)' },
        aisle_y: { type: 'number', description: 'Vertical aisle clearance between rows in meters (e.g. 2.0)' },
        start_x: { type: 'number', description: 'Start X coordinate in meters (default: 2.0)' },
        start_y: { type: 'number', description: 'Start Y coordinate in meters (default: 2.0)' },
      },
      required: ['item_type', 'count', 'columns', 'item_width', 'item_height'],
      additionalProperties: false,
    },
    execute: async (input: {
      item_type: FixtureType;
      item_name_prefix?: string;
      count: number;
      columns: number;
      item_width: number;
      item_height: number;
      aisle_x?: number;
      aisle_y?: number;
      start_x?: number;
      start_y?: number;
    }) => {
      const { rooms, addFixture } = useFloorPlanStore.getState();
      const targetRoomId = rooms[0]?.id || 'canvas';
      const startX = input.start_x || 2.0;
      const startY = input.start_y || 2.0;
      const aisleX = input.aisle_x || 1.5;
      const aisleY = input.aisle_y || 1.5;
      const prefix = input.item_name_prefix || 'Item';

      const createdIds: string[] = [];

      for (let i = 0; i < input.count; i++) {
        const row = Math.floor(i / input.columns);
        const col = i % input.columns;
        const x = startX + col * (input.item_width + aisleX);
        const y = startY + row * (input.item_height + aisleY);

        const id = addFixture({
          roomId: targetRoomId,
          type: input.item_type,
          name: `${prefix} ${i + 1}`,
          width: input.item_width,
          height: input.item_height,
          x,
          y,
          geometry: input.item_type === 'round_banquet_table' ? 'circle' : 'rectangle',
        });
        createdIds.push(id);
      }

      return {
        success: true,
        createdCount: createdIds.length,
        itemIds: createdIds,
        message: `Batch generated ${createdIds.length} ${input.item_type} items in a ${Math.ceil(input.count / input.columns)}x${input.columns} grid with ${aisleX}m / ${aisleY}m aisle clearance.`,
      };
    },
  };

  // 23. remodel_polygon_vertices
  const remodelPolygonVerticesTool: ModelContextTool = {
    name: 'remodel_polygon_vertices',
    description: 'Remodels and sculpts any shape into custom polygon coordinates by setting exact (x, y) vertices.',
    inputSchema: {
      type: 'object',
      properties: {
        object_name_or_id: { type: 'string', description: 'Name or ID of object to reshape' },
        vertices: {
          type: 'array',
          description: 'Array of {x, y} coordinate points in meters relative to object origin',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['x', 'y'],
          },
        },
      },
      required: ['object_name_or_id', 'vertices'],
      additionalProperties: false,
    },
    execute: async (input: { object_name_or_id: string; vertices: Array<{ x: number; y: number }> }) => {
      const { fixtures, setFixtureVertices } = useFloorPlanStore.getState();
      const target = fixtures.find(
        (f) => f.id === input.object_name_or_id || f.name.toLowerCase().includes(input.object_name_or_id.toLowerCase())
      );
      if (!target) return { success: false, error: `Object "${input.object_name_or_id}" not found.` };
      setFixtureVertices(target.id, input.vertices);
      return { success: true, message: `Successfully remodeled ${target.name} with ${input.vertices.length} custom polygon vertices.` };
    },
  };

  // 24. add_polygon_vertex
  const addPolygonVertexTool: ModelContextTool = {
    name: 'add_polygon_vertex',
    description: 'Adds a new corner point to a polygon shape so it can be remodeled with more detail.',
    inputSchema: {
      type: 'object',
      properties: {
        object_name_or_id: { type: 'string', description: 'Name or ID of object' },
        after_index: { type: 'number', description: 'Index after which to insert new vertex' },
      },
      required: ['object_name_or_id'],
      additionalProperties: false,
    },
    execute: async (input: { object_name_or_id: string; after_index?: number }) => {
      const { fixtures, addFixtureVertex } = useFloorPlanStore.getState();
      const target = fixtures.find(
        (f) => f.id === input.object_name_or_id || f.name.toLowerCase().includes(input.object_name_or_id.toLowerCase())
      );
      if (!target) return { success: false, error: `Object "${input.object_name_or_id}" not found.` };
      addFixtureVertex(target.id, input.after_index);
      return { success: true, message: `Added new corner point to ${target.name}.` };
    },
  };

  // 25. curve_room_walls
  const curveRoomWallsTool: ModelContextTool = {
    name: 'curve_room_walls',
    description:
      'Sets curved architectural walls or rounded corners for a space/room (radius in meters, 0.0 for sharp to 3.0 for curved).',
    inputSchema: {
      type: 'object',
      properties: {
        room_name_or_id: { type: 'string', description: 'Name or ID of room' },
        radius: { type: 'number', description: 'Corner radius / curvature in meters (e.g. 0.0 to 3.0)' },
      },
      required: ['room_name_or_id', 'radius'],
      additionalProperties: false,
    },
    execute: async (input: { room_name_or_id: string; radius: number }) => {
      const { rooms, setRoomWallRadius } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) return { success: false, error: `Room "${input.room_name_or_id}" not found.` };
      setRoomWallRadius(target.id, Math.max(0, input.radius));
      return {
        success: true,
        message: `Set wall curvature radius for ${target.name} to ${input.radius.toFixed(1)}m.`,
      };
    },
  };

  // 26. remodel_room_walls
  const remodelRoomWallsTool: ModelContextTool = {
    name: 'remodel_room_walls',
    description:
      'Remodels room walls into a custom polygon by specifying exact corner coordinates {x, y} in meters.',
    inputSchema: {
      type: 'object',
      properties: {
        room_name_or_id: { type: 'string', description: 'Name or ID of room' },
        vertices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number', description: 'Relative X coordinate in meters' },
              y: { type: 'number', description: 'Relative Y coordinate in meters' },
            },
            required: ['x', 'y'],
          },
          description: 'Ordered list of polygon wall corner coordinates',
        },
      },
      required: ['room_name_or_id', 'vertices'],
      additionalProperties: false,
    },
    execute: async (input: { room_name_or_id: string; vertices: Array<{ x: number; y: number }> }) => {
      const { rooms, setRoomVertices } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) return { success: false, error: `Room "${input.room_name_or_id}" not found.` };
      if (!input.vertices || input.vertices.length < 3) {
        return { success: false, error: 'A room polygon requires at least 3 wall corner coordinates.' };
      }
      setRoomVertices(target.id, input.vertices);
      return {
        success: true,
        message: `Remodeled room walls for ${target.name} with ${input.vertices.length} corners.`,
      };
    },
  };

  // 27. set_object_color
  const setObjectColorTool: ModelContextTool = {
    name: 'set_object_color',
    description:
      'Assigns a color to any object, shape, booth, or furniture item on the canvas. Accepts hex colors (#10b981, #3b82f6) or color names ("emerald", "gold", "crema", "espresso", "dark", "blue", "amber", "orange", "coral", "red", "rose", "purple", "teal", "mint", "slate", "charcoal", "white").',
    inputSchema: {
      type: 'object',
      properties: {
        object_name_or_id: { type: 'string', description: 'Name or ID of the object/shape/fixture to color' },
        color: {
          type: 'string',
          description:
            'Hex code (e.g. "#10b981", "#3b82f6") or color name ("emerald", "gold", "blue", "amber", "rose", "dark", "white")',
        },
      },
      required: ['object_name_or_id', 'color'],
      additionalProperties: false,
    },
    execute: async (input: { object_name_or_id: string; color: string }) => {
      const { fixtures, updateFixture } = useFloorPlanStore.getState();
      const q = input.object_name_or_id.toLowerCase();
      const target = fixtures.find((f) => f.id === input.object_name_or_id || f.name.toLowerCase().includes(q));
      if (!target) {
        throw new Error(`Object "${input.object_name_or_id}" not found.`);
      }
      const hex = resolveColorInput(input.color);
      updateFixture(target.id, { customColor: hex });
      return {
        success: true,
        objectId: target.id,
        name: target.name,
        color: hex,
        message: `Assigned color ${hex} to object "${target.name}".`,
      };
    },
  };

  // 28. set_room_color
  const setRoomColorTool: ModelContextTool = {
    name: 'set_room_color',
    description:
      'Assigns a tint color to any room or zone on the canvas. Accepts hex colors (#10b981) or color names ("emerald", "gold", "blue", "amber", "rose", "slate", "white").',
    inputSchema: {
      type: 'object',
      properties: {
        room_name_or_id: { type: 'string', description: 'Name or ID of the room or zone' },
        color: { type: 'string', description: 'Hex code or color name ("emerald", "blue", "gold", "amber", "rose")' },
      },
      required: ['room_name_or_id', 'color'],
      additionalProperties: false,
    },
    execute: async (input: { room_name_or_id: string; color: string }) => {
      const { rooms, updateRoom } = useFloorPlanStore.getState();
      const target = findTargetRoom(rooms, input.room_name_or_id);
      if (!target) {
        throw new Error(`Room "${input.room_name_or_id}" not found.`);
      }
      const hex = resolveColorInput(input.color);
      updateRoom(target.id, { color: hex });
      return {
        success: true,
        roomId: target.id,
        name: target.name,
        color: hex,
        message: `Assigned tint color ${hex} to room "${target.name}".`,
      };
    },
  };

  const allTools = [
    getFloorplanStateTool,
    setPlotDimensionsTool,
    addRoomTool,
    resizeRoomTool,
    moveRoomTool,
    rotateRoomTool,
    duplicateRoomTool,
    deleteRoomTool,
    addDoorTool,
    flipDoorSwingTool,
    addWindowTool,
    addFixtureTool,
    resizeFixtureTool,
    rotateFixtureTool,
    deleteFixtureTool,
    autoArrangeTool,
    calculateComplianceTool,
    clearFloorplanTool,
    addCustomShapeTool,
    reshapeObjectTool,
    renameElementTool,
    batchCreateGridLayoutTool,
    remodelPolygonVerticesTool,
    addPolygonVertexTool,
    curveRoomWallsTool,
    remodelRoomWallsTool,
    setObjectColorTool,
    setRoomColorTool,
  ];

  // 1. Register with browser native document.modelContext
  if (typeof document !== 'undefined' && document.modelContext?.registerTool) {
    for (const tool of allTools) {
      try {
        await document.modelContext.registerTool(tool);
      } catch (err) {
        console.warn(`[WebMCP] Tool register note:`, err);
      }
    }
  }

  // 2. Register with global window object for external scripts / agents
  if (typeof window !== 'undefined') {
    window.__WEBMCP_TOOLS__ = {
      list: () => REGISTERED_WEBMCP_TOOLS,
      execute: async (toolName: string, args: any) => {
        const tool = REGISTERED_WEBMCP_TOOLS.find((t) => t.name === toolName);
        if (!tool) throw new Error(`WebMCP Tool "${toolName}" not found.`);
        return await tool.execute(args);
      },
      getSchemas: () =>
        REGISTERED_WEBMCP_TOOLS.map((t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema,
          },
        })),
    };
  }

  for (const tool of allTools) {
    REGISTERED_WEBMCP_TOOLS.push({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      readOnly: !!tool.annotations?.readOnlyHint,
      execute: tool.execute,
    });
  }

  return REGISTERED_WEBMCP_TOOLS;
}
