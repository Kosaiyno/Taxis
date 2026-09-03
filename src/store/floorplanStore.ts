import { create } from 'zustand';
import {
  FloorPlanState,
  PlotDimensions,
  Room,
  Opening,
  Fixture,
  RoomType,
  OpeningType,
  FixtureType,
  WallOrientation,
  Unit,
  ShapeGeometry,
  VertexPoint,
  SpaceCategory,
  FloorPlanMetadata,
} from '../types/floorplan';
import { DEFAULT_INITIAL_PROJECT, ROOM_PRESETS, OPENING_PRESETS, FIXTURE_PRESETS, getDefaultVerticesForGeometry } from '../utils/defaultPresets';
import { snapToGrid } from '../utils/geometry';

interface FloorPlanStore extends FloorPlanState {
  history: Array<{ rooms: Room[]; openings: Opening[]; fixtures: Fixture[]; plot: PlotDimensions }>;
  historyIndex: number;

  setProjectName: (name: string) => void;
  setPlot: (plotUpdates: Partial<PlotDimensions>) => void;
  setUnit: (unit: Unit) => void;
  setCategory: (category: SpaceCategory) => void;
  setMetadata: (meta: Partial<FloorPlanMetadata>) => void;
  
  // Room Actions
  addRoom: (roomData: {
    name?: string;
    type?: RoomType;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    color?: string;
    wallRadius?: number;
    vertices?: VertexPoint[];
  }) => string;
  updateRoom: (id: string, updates: Partial<Room>, skipHistory?: boolean) => void;
  resizeRoom: (idOrName: string, width: number, height: number) => boolean;
  moveRoom: (idOrName: string, x: number, y: number) => boolean;
  rotateRoom: (id: string) => void;
  cloneRoom: (id: string) => string | null;
  deleteRoom: (idOrName: string) => boolean;
  setRoomWallRadius: (id: string, radius: number) => void;
  updateRoomVertex: (id: string, vertexIndex: number, newX: number, newY: number) => void;
  addRoomVertex: (id: string, afterIndex?: number) => void;
  removeRoomVertex: (id: string, vertexIndex: number) => void;
  setRoomVertices: (id: string, vertices: VertexPoint[]) => void;
  
  // Opening Actions (Doors & Windows)
  addOpening: (openingData: { roomId?: string; type: OpeningType; wall?: WallOrientation; offset?: number; width?: number; swingDirection?: 'inside' | 'outside' | 'left' | 'right' }) => string;
  updateOpening: (id: string, updates: Partial<Opening>) => void;
  moveOpening: (id: string, offset: number, wall?: WallOrientation) => void;
  resizeOpening: (id: string, width: number) => void;
  flipOpeningSwing: (id: string) => void;
  deleteOpening: (id: string) => void;
  
  // Fixture Actions (Furniture, Sanitary, Stairs, Custom Shapes)
  addFixture: (fixtureData: {
    roomId: string;
    type: FixtureType;
    name?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    geometry?: ShapeGeometry;
    customColor?: string;
    notes?: string;
  }) => string;
  updateFixture: (id: string, updates: Partial<Fixture>, skipHistory?: boolean) => void;
  moveFixture: (id: string, x: number, y: number, newRoomId?: string) => void;
  resizeFixture: (id: string, width: number, height: number) => void;
  rotateFixture: (id: string) => void;
  cloneFixture: (id: string) => string | null;
  deleteFixture: (id: string) => void;
  updateFixtureVertex: (id: string, vertexIndex: number, newX: number, newY: number) => void;
  addFixtureVertex: (id: string, afterIndex?: number) => void;
  removeFixtureVertex: (id: string, vertexIndex: number) => void;
  setFixtureVertices: (id: string, vertices: VertexPoint[]) => void;

  // Selection & Tools
  selectItem: (id: string | null, type: 'room' | 'opening' | 'fixture' | 'plot' | null) => void;
  setActiveTool: (tool: FloorPlanState['activeTool'], preset?: RoomType | OpeningType | FixtureType) => void;
  
  // Canvas viewport controls
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  resetView: () => void;
  toggleGridSnap: () => void;
  toggleDimensions: () => void;
  toggleGrid: () => void;
  setViewMode: (mode: '2d' | 'blueprint' | 'color') => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  recordHistory: () => void;

  // Bulk operations
  clearPlan: () => void;
  resetToDefault: () => void;
  loadState: (state: Partial<FloorPlanState>) => void;
  autoArrangeRooms: (requestedRooms: Array<{ name: string; type: RoomType; width?: number; height?: number }>) => boolean;
}

const pushHistory = (state: FloorPlanStore) => {
  const currentSnapshot = {
    rooms: JSON.parse(JSON.stringify(state.rooms)),
    openings: JSON.parse(JSON.stringify(state.openings)),
    fixtures: JSON.parse(JSON.stringify(state.fixtures)),
    plot: JSON.parse(JSON.stringify(state.plot)),
  };

  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(currentSnapshot);

  if (newHistory.length > 50) {
    newHistory.shift();
  }

  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

const STORAGE_KEY = 'taxis_spatial_project_v1';

function loadPersistedState(): Partial<FloorPlanState> | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.rooms) && parsed.plot) {
      return parsed;
    }
  } catch (e) {
    console.warn('[Taxis] Failed to load saved plan from localStorage', e);
  }
  return null;
}

const savedState = loadPersistedState();
const initialProject = savedState
  ? {
      projectName: savedState.projectName || DEFAULT_INITIAL_PROJECT.projectName,
      plot: savedState.plot || DEFAULT_INITIAL_PROJECT.plot,
      rooms: savedState.rooms || DEFAULT_INITIAL_PROJECT.rooms,
      openings: savedState.openings || DEFAULT_INITIAL_PROJECT.openings,
      fixtures: savedState.fixtures || DEFAULT_INITIAL_PROJECT.fixtures,
      metadata: savedState.metadata,
      activeCategory: savedState.activeCategory,
    }
  : DEFAULT_INITIAL_PROJECT;

export const useFloorPlanStore = create<FloorPlanStore>((set, get) => ({
  projectName: initialProject.projectName,
  plot: initialProject.plot,
  rooms: initialProject.rooms,
  openings: initialProject.openings,
  fixtures: initialProject.fixtures,
  metadata: (initialProject as any).metadata,
  activeCategory: (initialProject as any).activeCategory,
  selectedId: null,
  selectedType: null,
  activeTool: 'select',
  activeRoomPreset: 'bedroom',
  activeOpeningPreset: 'single_door',
  activeFixturePreset: 'sofa',
  gridSnap: true,
  gridSnapSize: 0.1,
  showDimensions: true,
  showGrid: true,
  zoom: 1.1,
  pan: { x: 100, y: 70 },
  viewMode: '2d',
  history: [
    {
      rooms: JSON.parse(JSON.stringify(initialProject.rooms)),
      openings: JSON.parse(JSON.stringify(initialProject.openings)),
      fixtures: JSON.parse(JSON.stringify(initialProject.fixtures)),
      plot: JSON.parse(JSON.stringify(initialProject.plot)),
    },
  ],
  historyIndex: 0,

  setProjectName: (name) => set({ projectName: name }),

  setPlot: (plotUpdates) => {
    set((state) => {
      const updated = { ...state.plot, ...plotUpdates };
      return { plot: updated, ...pushHistory(state) };
    });
  },

  setUnit: (unit) => {
    set((state) => ({
      plot: { ...state.plot, unit },
    }));
  },

  setCategory: (category) => set({ activeCategory: category }),

  setMetadata: (meta) =>
    set((state) => ({
      metadata: { ...(state.metadata || {}), ...meta },
    })),

  recordHistory: () => {
    set((state) => pushHistory(state));
  },

  addRoom: (roomData) => {
    const id = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const preset = roomData.type ? ROOM_PRESETS[roomData.type] : ROOM_PRESETS.bedroom;
    const width = snapToGrid(roomData.width || preset.defaultWidth, 0.1);
    const height = snapToGrid(roomData.height || preset.defaultHeight, 0.1);

    const existingRooms = get().rooms;
    let x = roomData.x ?? 3.0;
    let y = roomData.y ?? 2.5;

    if (roomData.x === undefined && roomData.y === undefined && existingRooms.length > 0) {
      const last = existingRooms[existingRooms.length - 1];
      if (last.x + last.width + width <= get().plot.width - 1.0) {
        x = last.x + last.width;
        y = last.y;
      } else {
        x = 3.0;
        y = last.y + last.height + 0.2;
      }
    }

    const newRoom: Room = {
      id,
      name: roomData.name || preset.name,
      type: roomData.type || 'bedroom',
      x: snapToGrid(x, 0.1),
      y: snapToGrid(y, 0.1),
      width,
      height,
      color: roomData.color || preset.color,
      floorTexture: preset.floorTexture,
      wallRadius: roomData.wallRadius ?? 0,
      vertices: roomData.vertices,
    };

    set((state) => {
      const nextRooms = [...state.rooms, newRoom];
      const nextState = {
        ...state,
        rooms: nextRooms,
        selectedId: id,
        selectedType: 'room' as const,
      };
      return { ...nextState, ...pushHistory(nextState) };
    });

    return id;
  },

  updateRoom: (id, updates, skipHistory = false) => {
    set((state) => {
      const rooms = state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r));
      const nextState = { ...state, rooms };
      return skipHistory ? nextState : { ...nextState, ...pushHistory(nextState) };
    });
  },

  setRoomWallRadius: (id, radius) => {
    set((state) => {
      const rooms = state.rooms.map((r) => (r.id === id ? { ...r, wallRadius: Math.max(0, radius) } : r));
      const nextState = { ...state, rooms };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  updateRoomVertex: (id, vertexIndex, newX, newY) => {
    set((state) => {
      const rooms = state.rooms.map((r) => {
        if (r.id === id) {
          const verts = r.vertices
            ? [...r.vertices]
            : [
                { x: 0, y: 0 },
                { x: r.width, y: 0 },
                { x: r.width, y: r.height },
                { x: 0, y: r.height },
              ];
          if (verts[vertexIndex]) {
            verts[vertexIndex] = { x: Math.max(0, snapToGrid(newX, 0.05)), y: Math.max(0, snapToGrid(newY, 0.05)) };
          }
          return { ...r, vertices: verts };
        }
        return r;
      });
      return { rooms };
    });
  },

  addRoomVertex: (id, afterIndex) => {
    set((state) => {
      const rooms = state.rooms.map((r) => {
        if (r.id === id) {
          const verts = r.vertices
            ? [...r.vertices]
            : [
                { x: 0, y: 0 },
                { x: r.width, y: 0 },
                { x: r.width, y: r.height },
                { x: 0, y: r.height },
              ];
          const idx = afterIndex !== undefined ? afterIndex : verts.length - 1;
          const p1 = verts[idx];
          const p2 = verts[(idx + 1) % verts.length];
          const newPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
          verts.splice(idx + 1, 0, newPoint);
          return { ...r, vertices: verts };
        }
        return r;
      });
      const nextState = { ...state, rooms };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  removeRoomVertex: (id, vertexIndex) => {
    set((state) => {
      const rooms = state.rooms.map((r) => {
        if (r.id === id) {
          let verts = r.vertices
            ? [...r.vertices]
            : [
                { x: 0, y: 0 },
                { x: r.width, y: 0 },
                { x: r.width, y: r.height },
                { x: 0, y: r.height },
              ];
          if (verts.length > 3) {
            verts = verts.filter((_, i) => i !== vertexIndex);
          }
          return { ...r, vertices: verts };
        }
        return r;
      });
      const nextState = { ...state, rooms };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  setRoomVertices: (id, vertices) => {
    set((state) => {
      const rooms = state.rooms.map((r) => (r.id === id ? { ...r, vertices } : r));
      const nextState = { ...state, rooms };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  resizeRoom: (idOrName, width, height) => {
    const target = get().rooms.find((r) => r.id === idOrName || r.name.toLowerCase() === idOrName.toLowerCase());
    if (!target) return false;

    const clampedW = Math.max(1.0, snapToGrid(width, 0.1));
    const clampedH = Math.max(1.0, snapToGrid(height, 0.1));

    set((state) => {
      const rooms = state.rooms.map((r) => (r.id === target.id ? { ...r, width: clampedW, height: clampedH } : r));
      const nextState = { ...state, rooms };
      return { ...nextState, ...pushHistory(nextState) };
    });
    return true;
  },

  moveRoom: (idOrName, x, y) => {
    const target = get().rooms.find((r) => r.id === idOrName || r.name.toLowerCase() === idOrName.toLowerCase());
    if (!target) return false;

    const clampedX = Math.max(0, snapToGrid(x, 0.1));
    const clampedY = Math.max(0, snapToGrid(y, 0.1));

    set((state) => {
      const rooms = state.rooms.map((r) => (r.id === target.id ? { ...r, x: clampedX, y: clampedY } : r));
      const nextState = { ...state, rooms };
      return { ...nextState, ...pushHistory(nextState) };
    });
    return true;
  },

  rotateRoom: (id) => {
    set((state) => {
      const rooms = state.rooms.map((r) => {
        if (r.id === id) {
          return { ...r, width: r.height, height: r.width };
        }
        return r;
      });
      const nextState = { ...state, rooms };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  cloneRoom: (id) => {
    const target = get().rooms.find((r) => r.id === id);
    if (!target) return null;

    const newId = `room-${Date.now()}`;
    const newRoom: Room = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
      x: target.x + 0.5,
      y: target.y + 0.5,
    };

    set((state) => {
      const rooms = [...state.rooms, newRoom];
      const nextState = { ...state, rooms, selectedId: newId, selectedType: 'room' as const };
      return { ...nextState, ...pushHistory(nextState) };
    });
    return newId;
  },

  deleteRoom: (idOrName) => {
    const target = get().rooms.find((r) => r.id === idOrName || r.name.toLowerCase() === idOrName.toLowerCase());
    if (!target) return false;

    set((state) => {
      const rooms = state.rooms.filter((r) => r.id !== target.id);
      const openings = state.openings.filter((o) => o.roomId !== target.id);
      const fixtures = state.fixtures.filter((f) => f.roomId !== target.id);
      const selectedId = state.selectedId === target.id ? null : state.selectedId;
      const selectedType = state.selectedId === target.id ? null : state.selectedType;

      const nextState = { ...state, rooms, openings, fixtures, selectedId, selectedType };
      return { ...nextState, ...pushHistory(nextState) };
    });
    return true;
  },

  addOpening: (openingData) => {
    const id = `op-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const preset = OPENING_PRESETS[openingData.type];
    const targetRoomId = openingData.roomId || get().selectedId || get().rooms[0]?.id;
    if (!targetRoomId) return '';

    const newOpening: Opening = {
      id,
      roomId: targetRoomId,
      type: openingData.type,
      wall: openingData.wall || 'south',
      offset: openingData.offset ?? 1.0,
      width: openingData.width ?? preset?.defaultWidth ?? 0.9,
      swingDirection: openingData.swingDirection ?? 'inside',
    };

    set((state) => {
      const openings = [...state.openings, newOpening];
      const nextState = { ...state, openings, selectedId: id, selectedType: 'opening' as const };
      return { ...nextState, ...pushHistory(nextState) };
    });
    return id;
  },

  updateOpening: (id, updates) => {
    set((state) => {
      const openings = state.openings.map((o) => (o.id === id ? { ...o, ...updates } : o));
      const nextState = { ...state, openings };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  moveOpening: (id, offset, wall) => {
    set((state) => {
      const openings = state.openings.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            offset: Math.max(0.1, snapToGrid(offset, 0.05)),
            ...(wall ? { wall } : {}),
          };
        }
        return o;
      });
      return { openings };
    });
  },

  resizeOpening: (id, width) => {
    set((state) => {
      const openings = state.openings.map((o) => {
        if (o.id === id) {
          return { ...o, width: Math.max(0.5, snapToGrid(width, 0.05)) };
        }
        return o;
      });
      const nextState = { ...state, openings };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  flipOpeningSwing: (id) => {
    set((state) => {
      const openings = state.openings.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            swingDirection: (o.swingDirection === 'outside' ? 'inside' : 'outside') as any,
          };
        }
        return o;
      });
      const nextState = { ...state, openings };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  deleteOpening: (id) => {
    set((state) => {
      const openings = state.openings.filter((o) => o.id !== id);
      const selectedId = state.selectedId === id ? null : state.selectedId;
      const nextState = { ...state, openings, selectedId };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  addFixture: (fixtureData) => {
    const id = `fix-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const preset = FIXTURE_PRESETS[fixtureData.type];
    const newFixture: Fixture = {
      id,
      roomId: fixtureData.roomId,
      type: fixtureData.type,
      name: fixtureData.name || preset?.name || 'Object',
      x: fixtureData.x ?? 0.8,
      y: fixtureData.y ?? 0.8,
      width: fixtureData.width ?? preset?.defaultWidth ?? 2.0,
      height: fixtureData.height ?? preset?.defaultHeight ?? 1.0,
      rotation: fixtureData.rotation ?? 0,
      geometry: fixtureData.geometry || preset?.defaultGeometry || 'rectangle',
      customColor: fixtureData.customColor,
      notes: fixtureData.notes,
    };

    set((state) => {
      const fixtures = [...state.fixtures, newFixture];
      const nextState = { ...state, fixtures, selectedId: id, selectedType: 'fixture' as const };
      return { ...nextState, ...pushHistory(nextState) };
    });
    return id;
  },

  updateFixture: (id, updates, skipHistory = false) => {
    set((state) => {
      const fixtures = state.fixtures.map((f) => (f.id === id ? { ...f, ...updates } : f));
      const nextState = { ...state, fixtures };
      return skipHistory ? nextState : { ...nextState, ...pushHistory(nextState) };
    });
  },

  moveFixture: (id, x, y, newRoomId) => {
    set((state) => {
      const fixtures = state.fixtures.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            x: Math.max(0, snapToGrid(x, 0.05)),
            y: Math.max(0, snapToGrid(y, 0.05)),
            ...(newRoomId ? { roomId: newRoomId } : {}),
          };
        }
        return f;
      });
      return { fixtures };
    });
  },

  resizeFixture: (id, width, height) => {
    set((state) => {
      const fixtures = state.fixtures.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            width: Math.max(0.3, snapToGrid(width, 0.05)),
            height: Math.max(0.3, snapToGrid(height, 0.05)),
          };
        }
        return f;
      });
      const nextState = { ...state, fixtures };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  rotateFixture: (id) => {
    set((state) => {
      const fixtures = state.fixtures.map((f) => {
        if (f.id === id) {
          return { ...f, rotation: ((f.rotation + 90) % 360) as any };
        }
        return f;
      });
      const nextState = { ...state, fixtures };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  cloneFixture: (id) => {
    const target = get().fixtures.find((f) => f.id === id);
    if (!target) return null;

    const newId = `fix-${Date.now()}`;
    const newFixture: Fixture = {
      ...target,
      id: newId,
      x: target.x + 0.3,
      y: target.y + 0.3,
    };

    set((state) => {
      const fixtures = [...state.fixtures, newFixture];
      const nextState = { ...state, fixtures, selectedId: newId, selectedType: 'fixture' as const };
      return { ...nextState, ...pushHistory(nextState) };
    });
    return newId;
  },

  deleteFixture: (id) => {
    set((state) => {
      const fixtures = state.fixtures.filter((f) => f.id !== id);
      const selectedId = state.selectedId === id ? null : state.selectedId;
      const nextState = { ...state, fixtures, selectedId };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  updateFixtureVertex: (id, vertexIndex, newX, newY) => {
    set((state) => {
      const fixtures = state.fixtures.map((f) => {
        if (f.id === id) {
          const verts = f.vertices ? [...f.vertices] : getDefaultVerticesForGeometry(f.geometry || 'rectangle', f.width, f.height);
          if (verts[vertexIndex]) {
            verts[vertexIndex] = { x: Math.max(0, snapToGrid(newX, 0.05)), y: Math.max(0, snapToGrid(newY, 0.05)) };
          }
          return { ...f, vertices: verts };
        }
        return f;
      });
      return { fixtures };
    });
  },

  addFixtureVertex: (id, afterIndex) => {
    set((state) => {
      const fixtures = state.fixtures.map((f) => {
        if (f.id === id) {
          const verts = f.vertices ? [...f.vertices] : getDefaultVerticesForGeometry(f.geometry || 'rectangle', f.width, f.height);
          const idx = afterIndex !== undefined ? afterIndex : verts.length - 1;
          const p1 = verts[idx];
          const p2 = verts[(idx + 1) % verts.length];
          const newPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
          verts.splice(idx + 1, 0, newPoint);
          return { ...f, vertices: verts };
        }
        return f;
      });
      const nextState = { ...state, fixtures };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  removeFixtureVertex: (id, vertexIndex) => {
    set((state) => {
      const fixtures = state.fixtures.map((f) => {
        if (f.id === id) {
          let verts = f.vertices ? [...f.vertices] : getDefaultVerticesForGeometry(f.geometry || 'rectangle', f.width, f.height);
          if (verts.length > 3) {
            verts = verts.filter((_, i) => i !== vertexIndex);
          }
          return { ...f, vertices: verts };
        }
        return f;
      });
      const nextState = { ...state, fixtures };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  setFixtureVertices: (id, vertices) => {
    set((state) => {
      const fixtures = state.fixtures.map((f) => {
        if (f.id === id) {
          return { ...f, vertices };
        }
        return f;
      });
      const nextState = { ...state, fixtures };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  selectItem: (id, type) => {
    set({ selectedId: id, selectedType: type });
  },

  setActiveTool: (tool, preset) => {
    set((state) => {
      const updates: Partial<FloorPlanState> = { activeTool: tool };
      if (tool === 'room' && preset) updates.activeRoomPreset = preset as RoomType;
      if ((tool === 'door' || tool === 'window') && preset) updates.activeOpeningPreset = preset as OpeningType;
      if ((tool === 'stairs' || tool === 'fixture') && preset) updates.activeFixturePreset = preset as FixtureType;
      return { ...state, ...updates };
    });
  },

  setZoom: (zoomOrFn) => {
    set((state) => ({
      zoom: typeof zoomOrFn === 'function' ? Math.max(0.3, Math.min(3.0, zoomOrFn(state.zoom))) : Math.max(0.3, Math.min(3.0, zoomOrFn)),
    }));
  },

  setPan: (panOrFn) => {
    set((state) => ({
      pan: typeof panOrFn === 'function' ? panOrFn(state.pan) : panOrFn,
    }));
  },

  resetView: () => {
    set({ zoom: 1.1, pan: { x: 100, y: 70 } });
  },

  toggleGridSnap: () => set((state) => ({ gridSnap: !state.gridSnap })),
  toggleDimensions: () => set((state) => ({ showDimensions: !state.showDimensions })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  setViewMode: (mode) => set({ viewMode: mode }),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const snapshot = history[prevIndex];
      set({
        rooms: JSON.parse(JSON.stringify(snapshot.rooms)),
        openings: JSON.parse(JSON.stringify(snapshot.openings)),
        fixtures: JSON.parse(JSON.stringify(snapshot.fixtures)),
        plot: JSON.parse(JSON.stringify(snapshot.plot)),
        historyIndex: prevIndex,
        selectedId: null,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const snapshot = history[nextIndex];
      set({
        rooms: JSON.parse(JSON.stringify(snapshot.rooms)),
        openings: JSON.parse(JSON.stringify(snapshot.openings)),
        fixtures: JSON.parse(JSON.stringify(snapshot.fixtures)),
        plot: JSON.parse(JSON.stringify(snapshot.plot)),
        historyIndex: nextIndex,
        selectedId: null,
      });
    }
  },

  clearPlan: () => {
    set((state) => {
      const nextState = {
        ...state,
        rooms: [],
        openings: [],
        fixtures: [],
        selectedId: null,
        selectedType: null,
      };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  resetToDefault: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
    set((state) => {
      const nextState = {
        ...state,
        projectName: DEFAULT_INITIAL_PROJECT.projectName,
        plot: JSON.parse(JSON.stringify(DEFAULT_INITIAL_PROJECT.plot)),
        rooms: JSON.parse(JSON.stringify(DEFAULT_INITIAL_PROJECT.rooms)),
        openings: JSON.parse(JSON.stringify(DEFAULT_INITIAL_PROJECT.openings)),
        fixtures: JSON.parse(JSON.stringify(DEFAULT_INITIAL_PROJECT.fixtures)),
        selectedId: null,
        selectedType: null,
      };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  loadState: (partialState) => {
    set((state) => {
      const nextState = { ...state, ...partialState };
      return { ...nextState, ...pushHistory(nextState) };
    });
  },

  autoArrangeRooms: (requestedRooms) => {
    const startX = 3.0;
    const startY = 2.5;
    let currentX = startX;
    let currentY = startY;
    let rowHeight = 0;

    const newRooms: Room[] = [];

    for (const req of requestedRooms) {
      const preset = ROOM_PRESETS[req.type] || ROOM_PRESETS.bedroom;
      const w = snapToGrid(req.width || preset.defaultWidth, 0.1);
      const h = snapToGrid(req.height || preset.defaultHeight, 0.1);

      if (currentX + w > 14.0 && currentX > startX) {
        currentX = startX;
        currentY += rowHeight;
        rowHeight = 0;
      }

      const id = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      newRooms.push({
        id,
        name: req.name || preset.name,
        type: req.type,
        x: currentX,
        y: currentY,
        width: w,
        height: h,
        color: preset.color,
        floorTexture: preset.floorTexture,
      });

      currentX += w;
      rowHeight = Math.max(rowHeight, h);
    }

    set((state) => {
      const nextState = {
        ...state,
        rooms: newRooms,
        openings: [],
        fixtures: [],
        selectedId: null,
      };
      return { ...nextState, ...pushHistory(nextState) };
    });

    return true;
  },
}));

// Subscribe to automatically persist any changes (by human or agent) to localStorage
let saveTimeout: any = null;
useFloorPlanStore.subscribe((state) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const snapshot = {
        projectName: state.projectName,
        plot: state.plot,
        rooms: state.rooms,
        openings: state.openings,
        fixtures: state.fixtures,
        metadata: state.metadata,
        activeCategory: state.activeCategory,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.warn('[Taxis] Failed to auto-save to localStorage', e);
    }
  }, 100);
});
