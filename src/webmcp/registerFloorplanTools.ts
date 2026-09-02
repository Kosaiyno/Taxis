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
 * Register all FloorCraft architectural tools with WebMCP (document.modelContext)
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
