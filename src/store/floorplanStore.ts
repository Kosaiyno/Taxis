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
} from '../types/floorplan';
import { DEFAULT_INITIAL_PROJECT, ROOM_PRESETS, OPENING_PRESETS, FIXTURE_PRESETS } from '../utils/defaultPresets';
import { snapToGrid } from '../utils/geometry';

interface FloorPlanStore extends FloorPlanState {
  history: Array<{ rooms: Room[]; openings: Opening[]; fixtures: Fixture[]; plot: PlotDimensions }>;
  historyIndex: number;

  setProjectName: (name: string) => void;
  setPlot: (plotUpdates: Partial<PlotDimensions>) => void;
  setUnit: (unit: Unit) => void;
  
  // Room Actions
  addRoom: (roomData: { name?: string; type?: RoomType; width?: number; height?: number; x?: number; y?: number; color?: string }) => string;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  resizeRoom: (idOrName: string, width: number, height: number) => boolean;
  moveRoom: (idOrName: string, x: number, y: number) => boolean;
  rotateRoom: (id: string) => void;
  cloneRoom: (id: string) => string | null;
  deleteRoom: (idOrName: string) => boolean;
  
  // Opening Actions (Doors & Windows)
  addOpening: (openingData: { roomId: string; type: OpeningType; wall: WallOrientation; offset?: number; width?: number; swingDirection?: 'inside' | 'outside' | 'left' | 'right' }) => string;
  updateOpening: (id: string, updates: Partial<Opening>) => void;
  moveOpening: (id: string, offset: number, wall?: WallOrientation) => void;
  resizeOpening: (id: string, width: number) => void;
  flipOpeningSwing: (id: string) => void;
  deleteOpening: (id: string) => void;
  
  // Fixture Actions (Furniture, Sanitary, Stairs)
  addFixture: (fixtureData: { roomId: string; type: FixtureType; name?: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }) => string;
  updateFixture: (id: string, updates: Partial<Fixture>) => void;
  moveFixture: (id: string, x: number, y: number, newRoomId?: string) => void;
  resizeFixture: (id: string, width: number, height: number) => void;
  rotateFixture: (id: string) => void;
  cloneFixture: (id: string) => string | null;
  deleteFixture: (id: string) => void;

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

  if (newHistory.length > 30) {
    newHistory.shift();
  }

  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

export const useFloorPlanStore = create<FloorPlanStore>((set, get) => ({
  projectName: DEFAULT_INITIAL_PROJECT.projectName,
  plot: DEFAULT_INITIAL_PROJECT.plot,
  rooms: DEFAULT_INITIAL_PROJECT.rooms,
  openings: DEFAULT_INITIAL_PROJECT.openings,
  fixtures: DEFAULT_INITIAL_PROJECT.fixtures,
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
      rooms: JSON.parse(JSON.stringify(DEFAULT_INITIAL_PROJECT.rooms)),
      openings: JSON.parse(JSON.stringify(DEFAULT_INITIAL_PROJECT.openings)),
      fixtures: JSON.parse(JSON.stringify(DEFAULT_INITIAL_PROJECT.fixtures)),
      plot: JSON.parse(JSON.stringify(DEFAULT_INITIAL_PROJECT.plot)),
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

  updateRoom: (id, updates) => {
    set((state) => {
      const rooms = state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r));
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
    const newOpening: Opening = {
      id,
      roomId: openingData.roomId,
      type: openingData.type,
      wall: openingData.wall,
      offset: openingData.offset ?? 1.0,
      width: openingData.width ?? preset.defaultWidth,
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
      name: fixtureData.name || preset.name,
      x: fixtureData.x ?? 0.8,
      y: fixtureData.y ?? 0.8,
      width: fixtureData.width ?? preset.defaultWidth,
      height: fixtureData.height ?? preset.defaultHeight,
      rotation: fixtureData.rotation ?? 0,
    };

    set((state) => {
      const fixtures = [...state.fixtures, newFixture];
      const nextState = { ...state, fixtures, selectedId: id, selectedType: 'fixture' as const };
      return { ...nextState, ...pushHistory(nextState) };
    });
    return id;
  },

  updateFixture: (id, updates) => {
    set((state) => {
      const fixtures = state.fixtures.map((f) => (f.id === id ? { ...f, ...updates } : f));
      const nextState = { ...state, fixtures };
      return { ...nextState, ...pushHistory(nextState) };
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
